import { connectToDatabase } from '../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { crimeQuerySchema, sanitizeMongoQuery } from '../../lib/validation';
import { checkRateLimit, apiRateLimiter } from '../../lib/rateLimit';
import { logger, getRequestContext } from '../../../lib/logger';
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
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // Validate with Zod
    const validated = crimeQuerySchema.parse(queryParams);

    // Sanitize the query parameters
    const sanitizedQuery = sanitizeMongoQuery({
      month: validated.type,
      year: validated.year,
    });

    // Calculate the starting index of the items for the given page
    const skip = (validated.page - 1) * validated.limit;

    // Connect to database with timeout
    const client = await connectToDatabase();
    const db = client.db();
    const collection = db.collection('crimes');

    // Set a timeout for the MongoDB query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 10000); // 10 second timeout
    });

    const queryPromise = collection.findOne(sanitizedQuery, {
      maxTimeMS: 10000, // MongoDB timeout
      projection: { _id: 0, crimes: 1 }, // Only get crimes array
    });

    // Race between query and timeout
    const data = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (!data || !data.crimes) {
      const response = NextResponse.json(
        {
          crimes: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: validated.page,
        },
        { status: 200 }
      );

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

      return response;
    }

    // Validate that crimes is an array
    if (!Array.isArray(data.crimes)) {
      throw new Error('Invalid data format: crimes is not an array');
    }

    const crimes = data.crimes.slice(skip, skip + validated.limit);
    const totalItems = data.crimes.length;
    const totalPages = Math.ceil(totalItems / validated.limit);

    const response = NextResponse.json({
      crimes,
      totalItems,
      totalPages,
      currentPage: validated.page,
    });

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return response;
  } catch (error: any) {
    const context = getRequestContext(request);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('Crime API validation error', {
        ...context,
        validationErrors: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
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
        { error: 'Request timeout. Please try with smaller limit or different parameters.' },
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
