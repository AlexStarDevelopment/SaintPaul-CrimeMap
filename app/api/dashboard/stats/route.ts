import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MockDashboardService } from '../../../../lib/mockData.js';
import {
  handleApiError,
  createAuthenticationError,
  createValidationError,
  createNotFoundError,
} from '@/lib/api';
import { isDashboardEnabledCached } from '@/lib';

// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  try {
    // Feature flag enforcement
    const enabled = await isDashboardEnabledCached();
    if (!enabled) {
      return NextResponse.json({ error: 'Dashboard is disabled' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw createAuthenticationError('Please sign in to access dashboard statistics');
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const period = searchParams.get('period') || '30d';

    if (!locationId) {
      throw createValidationError('Location ID is required', {
        parameter: 'locationId',
        expected: 'string',
        received: 'null',
      });
    }

    // Validate period format
    const validPeriods = ['7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period)) {
      throw createValidationError('Invalid period specified', {
        parameter: 'period',
        expected: validPeriods,
        received: period,
      });
    }

    // Get dashboard data using mock service
    const dashboardData: any = await MockDashboardService.getCompleteDashboardData(
      session.user.id,
      locationId,
      period
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: dashboardData.stats,
        timestamp: new Date().toISOString(),
        mock: dashboardData.mock || false,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/dashboard/stats',
      method: 'GET',
      userId: request.headers.get('user-id'), // If available
    });
  }
}
