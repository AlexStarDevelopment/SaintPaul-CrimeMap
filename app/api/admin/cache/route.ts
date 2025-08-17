import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { CrimeCacheService } from '../../../../lib/cacheService';
import { 
  handleApiError, 
  createAuthenticationError,
  createAuthorizationError
} from '../../../../lib/apiErrorHandler';

// GET /api/admin/cache - Get cache statistics and status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw createAuthenticationError('Authentication required to access cache information');
    }

    // For now, any authenticated user can view cache stats
    // In production, you might want to restrict this to admin users
    const stats = CrimeCacheService.getCacheStats();
    const entries = CrimeCacheService.getCacheEntries();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        entries: entries.map(({ key, entry }) => ({
          key,
          timestamp: entry.timestamp,
          hits: entry.hits,
          lastAccessed: entry.lastAccessed,
          age: Date.now() - entry.timestamp,
        })),
        serverInfo: {
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/cache',
      method: 'GET',
    });
  }
}

// DELETE /api/admin/cache - Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw createAuthenticationError('Authentication required to clear cache');
    }

    // For now, any authenticated user can clear cache
    // In production, you might want to restrict this to admin users only
    
    const statsBeforeClear = CrimeCacheService.getCacheStats();
    
    CrimeCacheService.clearCrimeCache();
    
    const statsAfterClear = CrimeCacheService.getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cache cleared successfully',
        cleared: {
          entries: statsBeforeClear.entries,
          memoryFreed: statsBeforeClear.totalSize,
        },
        newStats: statsAfterClear,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/cache',
      method: 'DELETE',
    });
  }
}

// POST /api/admin/cache/warm - Warm cache with popular data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw createAuthenticationError('Authentication required to warm cache');
    }

    // Start cache warming in background
    const warmingPromise = CrimeCacheService.warmCache();
    
    // Don't wait for completion, return immediately
    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Cache warming started',
        status: 'in_progress',
        timestamp: new Date().toISOString(),
      },
    });

    // Warm cache in background
    warmingPromise.catch(error => {
      console.error('Cache warming failed:', error);
    });

    return response;
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/cache',
      method: 'POST',
    });
  }
}