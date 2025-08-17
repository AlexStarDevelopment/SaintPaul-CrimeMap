import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { MockDashboardService } from '../../../../lib/mockData.js';

// GET /api/dashboard/safety-score
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    // Get dashboard data using mock service
    const dashboardData = await MockDashboardService.getCompleteDashboardData(
      session.user.id,
      locationId,
      '30d'
    );

    return NextResponse.json({
      locationId: dashboardData.location.id,
      locationLabel: dashboardData.location.label,
      safetyScore: dashboardData.safetyScore,
    });
  } catch (error) {
    console.error('Error calculating safety score:', error);
    return NextResponse.json({ error: 'Failed to calculate safety score' }, { status: 500 });
  }
}
