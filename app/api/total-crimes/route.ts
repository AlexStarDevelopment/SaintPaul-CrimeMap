import { NextRequest, NextResponse } from 'next/server';
import { totalCrimesQuerySchema } from '../../lib/validation';
import { apiRateLimiter } from '../../lib/rateLimit';
import { CrimeCacheService } from '../../../lib/cacheService';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  // Check rate limit and get headers
  const { allowed, limit, remaining, reset } = await apiRateLimiter.isAllowed(request);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const queryParams = {
      type: searchParams.get('type') || undefined,
      year: searchParams.get('year') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // Validate with Zod
    const validated = totalCrimesQuerySchema.parse(queryParams);

    // Get total crime count using cache service
    const result = await CrimeCacheService.getTotalCrimes(
      validated.type,
      validated.year.toString()
    );

    const response = NextResponse.json(result);

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minute browser cache
    response.headers.set('X-Cache-Status', result.totalItems > 0 ? 'hit' : 'miss');

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return response;
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle timeout errors
    if (error.message === 'Query timeout') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again later.' },
        { status: 504 }
      );
    }

    // Log error for monitoring (but don't expose internal details)
    console.error('Error fetching total crimes:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching crime statistics' },
      { status: 500 }
    );
  }
}
