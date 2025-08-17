import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { MockDashboardService } from '../../../../lib/mockData.js';

// GET /api/dashboard/incidents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    // Get dashboard data using mock service
    const dashboardData = await MockDashboardService.getCompleteDashboardData(
      session.user.id,
      locationId,
      '7d'
    );

    // Limit the incidents if requested
    const incidents = dashboardData.incidents.slice(0, limit);

    return NextResponse.json({
      incidents,
      location: {
        id: dashboardData.location.id,
        label: dashboardData.location.label,
        radius: dashboardData.location.radius,
      },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}
