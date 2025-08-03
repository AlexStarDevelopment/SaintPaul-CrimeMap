import { connectToDatabase } from '../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { totalCrimesQuerySchema, sanitizeMongoQuery } from '../../lib/validation';
import { checkRateLimit, apiRateLimiter } from '../../lib/rateLimit';
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

    // Sanitize the query parameters
    const sanitizedQuery = sanitizeMongoQuery({
      month: validated.type,
      year: validated.year,
    });

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db();
    const collection = db.collection('crimes');

    // Set a timeout for the MongoDB query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 10000); // 10 second timeout
    });

    const queryPromise = collection.findOne(sanitizedQuery, {
      maxTimeMS: 10000, // MongoDB timeout
      projection: { _id: 0, 'crimes.length': 1 }, // Only get array length if possible
    });

    // Race between query and timeout
    const data = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (!data || !data.crimes) {
      const response = NextResponse.json({ totalItems: 0, totalPages: 0 }, { status: 200 });

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

    const totalItems = data.crimes.length;
    const totalPages = Math.ceil(totalItems / validated.limit);

    const response = NextResponse.json({ totalItems, totalPages });

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
