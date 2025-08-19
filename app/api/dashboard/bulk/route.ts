import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, addRateLimitHeaders } from '@/lib/api';
import { MockDashboardService } from '../../../../lib/mockData.js';
import { isDashboardEnabledCached } from '../../../../lib/featureFlags';

// Using mock data service to avoid MongoDB calls during development

// GET /api/dashboard/bulk - Get all dashboard data in one request
export async function GET(request: NextRequest) {
  // Apply stricter rate limiting for bulk endpoint
  const rateLimitResult = await rateLimit(request, {
    isBulkEndpoint: true,
  });

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
    const enabled = await isDashboardEnabledCached();
    if (!enabled) {
      return NextResponse.json({ error: 'Dashboard is disabled' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const period = searchParams.get('period') || '30d';

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    // Use mock data service instead of MongoDB
    const dashboardData = await MockDashboardService.getCompleteDashboardData(
      session.user.id,
      locationId,
      period
    );

    const response = NextResponse.json(dashboardData);
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Error fetching bulk dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
