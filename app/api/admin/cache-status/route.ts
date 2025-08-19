import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getMockCacheStatus, clearMockCache } from '../../../../lib/mockData.js';
import { CrimeCacheService } from '@/lib/cache';
import { getCacheStatus, clearCrimeCache } from '@/lib/services';

// GET /api/admin/cache-status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get status from all cache layers
    const mockCacheStatus = getMockCacheStatus();
    const legacyCacheStatus = getCacheStatus();
    const newCacheStats = CrimeCacheService.getCacheStats();

    return NextResponse.json({
      cache: {
        // Legacy cache (for dashboard/location services)
        legacy: legacyCacheStatus,
        // Mock data cache (currently used)
        mock: mockCacheStatus,
        // New enhanced cache (for main crime APIs)
        enhanced: newCacheStats,
      },
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

    // Clear all cache layers
    clearMockCache();
    clearCrimeCache();
    CrimeCacheService.clearCrimeCache();

    return NextResponse.json({
      message: 'All caches cleared successfully',
      cleared: ['mock', 'legacy', 'enhanced'],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
