import { NextRequest, NextResponse } from 'next/server';
import { crimeQuerySchema } from '../../lib/validation';
import { rateLimit, addRateLimitHeaders } from '../../../lib/rateLimit';
import { logger, getRequestContext } from '../../../lib/logger';
import { CrimeCacheService } from '../../../lib/cacheService';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await rateLimit(request);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
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
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // Validate with Zod
    const validated = crimeQuerySchema.parse(queryParams);

    // Get paginated crime data using cache service
    const result = await CrimeCacheService.getPaginatedCrimes(
      validated.type,
      validated.year.toString(),
      validated.page,
      validated.limit
    );

    const response = NextResponse.json(result);

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minute browser cache
    response.headers.set('X-Cache-Status', result.crimes.length > 0 ? 'hit' : 'miss');
    
    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error: any) {
    const context = getRequestContext(request);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('Crime API validation error', {
        ...context,
        validationErrors: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });

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
      logger.error('Crime API query timeout', error, context);
      return NextResponse.json(
        {
          error: 'Request timeout. Please try with smaller limit or different parameters.',
        },
        { status: 504 }
      );
    }

    // Log error securely without exposing internal details
    logger.error('Crime API error', error, context);

    return NextResponse.json(
      { error: 'An error occurred while fetching crime data' },
      { status: 500 }
    );
  }
}
