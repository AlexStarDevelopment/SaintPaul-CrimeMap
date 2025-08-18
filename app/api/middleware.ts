import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import {
  handleApiError,
  createAuthenticationError,
  createRateLimitError,
} from '../../lib/apiErrorHandler';

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiting function
function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  rateLimitMap.set(key, current);
  return true;
}

// Middleware wrapper for API routes
export function withApiMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { limit: number; windowMs: number };
    allowedMethods?: string[];
  } = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const { requireAuth = false, rateLimit, allowedMethods } = options;

      // Method validation
      if (allowedMethods && !allowedMethods.includes(req.method || '')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              type: 'METHOD_NOT_ALLOWED',
              message: `Method ${req.method} not allowed`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 405 }
        );
      }

      // Rate limiting
      if (rateLimit) {
        const identifier =
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const allowed = checkRateLimit(identifier, rateLimit.limit, rateLimit.windowMs);

        if (!allowed) {
          throw createRateLimitError('Too many requests. Please try again later.');
        }
      }

      // Authentication check
      if (requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          throw createAuthenticationError('Authentication required to access this resource');
        }
      }

      // Call the actual handler
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, {
        endpoint: req.url,
        method: req.method,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      });
    }
  };
}

// Utility function to add CORS headers
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Utility function to add security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

// Comprehensive middleware that includes common protections
export function withComprehensiveMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { limit: number; windowMs: number };
    allowedMethods?: string[];
    addCors?: boolean;
    addSecurity?: boolean;
  } = {}
) {
  return withApiMiddleware(async (req: NextRequest, context?: any) => {
    let response = await handler(req, context);

    if (options.addCors) {
      response = addCorsHeaders(response);
    }

    if (options.addSecurity) {
      response = addSecurityHeaders(response);
    }

    return response;
  }, options);
}
