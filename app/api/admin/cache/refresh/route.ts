import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CacheInvalidationService } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type = 'background' } = await request.json().catch(() => ({}));

    console.log(`🔄 Manual cache refresh requested by ${session.user?.email} (type: ${type})`);

    let result;

    switch (type) {
      case 'background':
        // Background refresh of popular entries near expiration
        result = await CacheInvalidationService.backgroundRefresh();
        break;

      case 'warm':
        // Full cache warming (refresh all popular data)
        const { warmPopularData } = await import('@/lib/cache');
        await warmPopularData();
        result = {
          action: 'cache_warming',
          message: 'Cache warming completed',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid refresh type. Use "background" or "warm"' },
          { status: 400 }
        );
    }

    console.log('🔄 Manual refresh completed:', result);

    return NextResponse.json({
      success: true,
      message: `Cache refresh completed (${type})`,
      refresh: {
        ...result,
        requestedBy: session.user?.email,
        type,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Manual cache refresh failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to refresh cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      endpoint: '/api/admin/cache/refresh',
      methods: ['POST'],
      description: 'Manual cache refresh for administrators',
      supportedTypes: ['background', 'warm'],
      examples: {
        backgroundRefresh: {
          method: 'POST',
          body: {
            type: 'background',
          },
          description: 'Refresh popular cache entries that are near expiration',
        },
        cacheWarming: {
          method: 'POST',
          body: {
            type: 'warm',
          },
          description: 'Full cache warming with popular datasets',
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get refresh info' }, { status: 500 });
  }
}
