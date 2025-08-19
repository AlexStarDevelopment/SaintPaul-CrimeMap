import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';

/**
 * Rate limit tracking - using in-memory store for simplicity
 * In production, consider using Redis or external caching service
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration based on authentication status and endpoint type
 */
const RATE_LIMITS = {
  authenticated: parseInt(process.env.RATE_LIMIT_AUTHENTICATED || '100'),
  unauthenticated: parseInt(process.env.RATE_LIMIT_UNAUTHENTICATED || '20'),
  bulk: parseInt(process.env.RATE_LIMIT_BULK_ENDPOINTS || '10'),
} as const;

/**
 * Rate limiting options
 */
interface RateLimitOptions {
  /** Custom limit override */
  limit?: number;
  /** Window duration in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Whether this is a bulk endpoint */
  isBulkEndpoint?: boolean;
  /** Custom identifier for rate limiting (defaults to IP address) */
  identifier?: string;
}

/**
 * Get rate limit configuration based on session and options
 */
function getRateLimit(isAuthenticated: boolean, options: RateLimitOptions = {}) {
  if (options.limit) {
    return options.limit;
  }

  if (options.isBulkEndpoint) {
    return RATE_LIMITS.bulk;
  }

  return isAuthenticated ? RATE_LIMITS.authenticated : RATE_LIMITS.unauthenticated;
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest, customId?: string): string {
  if (customId) return customId;

  // Try to get real IP from headers (for deployment behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' since NextRequest doesn't have direct IP access
  return 'unknown';
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware for API routes
 *
 * @param request - NextRequest object
 * @param options - Rate limiting options
 * @returns Object with success/failure and rate limit info
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  // Check if rate limiting is enabled
  if (process.env.ENABLE_RATE_LIMITING !== 'true') {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      resetTime: Date.now() + (options.windowMs || 60000),
    };
  }

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    // 10% chance to cleanup on each request
    cleanupExpiredEntries();
  }

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;
  const limit = getRateLimit(isAuthenticated, options);
  const windowMs = options.windowMs || 60000; // Default 1 minute
  const clientId = getClientIdentifier(request, options.identifier);

  // Create unique key for this client and endpoint
  const key = `${clientId}:${request.nextUrl.pathname}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  const result = {
    success,
    limit,
    remaining,
    resetTime: entry.resetTime,
  };

  if (!success) {
    return {
      ...result,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
    };
  }

  return result;
}

/**
 * Express-style middleware wrapper for rate limiting
 *
 * @param options - Rate limiting options
 * @returns NextResponse or continues to next handler
 */
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  return async function rateLimitMiddleware(request: NextRequest) {
    const result = await rateLimit(request, options);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      );
    }

    return null; // Continue to next handler
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: Awaited<ReturnType<typeof rateLimit>>
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  return response;
}

/**
 * Get current rate limit status for monitoring
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeClients: number;
  topClients: Array<{ key: string; count: number; resetTime: number }>;
} {
  const now = Date.now();
  const activeEntries = Array.from(rateLimitStore.entries()).filter(
    ([, entry]) => now <= entry.resetTime
  );

  const topClients = activeEntries
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([key, entry]) => ({
      key,
      count: entry.count,
      resetTime: entry.resetTime,
    }));

  return {
    totalEntries: rateLimitStore.size,
    activeClients: activeEntries.length,
    topClients,
  };
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
