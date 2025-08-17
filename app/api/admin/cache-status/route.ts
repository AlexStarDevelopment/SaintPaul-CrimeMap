import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getMockCacheStatus, clearMockCache } from '../../../../lib/mockData.js';

// GET /api/admin/cache-status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheStatus = getMockCacheStatus();

    return NextResponse.json({
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    return NextResponse.json({ error: 'Failed to fetch cache status' }, { status: 500 });
  }
}

// DELETE /api/admin/cache-status
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    clearMockCache();

    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
