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

    const body = await request.json();
    const { patterns, type = 'pattern', reason } = body;

    console.log(`🔄 Manual cache invalidation requested by ${session.user?.email}:`, {
      patterns,
      type,
      reason,
    });

    let result;

    switch (type) {
      case 'pattern':
        if (!patterns || !Array.isArray(patterns)) {
          return NextResponse.json(
            { error: 'Patterns array is required for pattern invalidation' },
            { status: 400 }
          );
        }
        result = await CacheInvalidationService.invalidateByPattern(patterns);
        break;

      case 'full':
        // Full cache clear
        const { CrimeCacheService } = await import('@/lib/cache');
        CrimeCacheService.clearCrimeCache();
        result = {
          invalidated: ['all'],
          errors: [],
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid invalidation type. Use "pattern" or "full"' },
          { status: 400 }
        );
    }

    console.log('🔄 Manual invalidation completed:', result);

    return NextResponse.json({
      success: true,
      message: `Cache invalidation completed (${type})`,
      invalidation: {
        ...result,
        requestedBy: session.user?.email,
        reason: reason || 'Manual invalidation',
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Manual cache invalidation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to invalidate cache',
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
      endpoint: '/api/admin/cache/invalidate',
      methods: ['POST'],
      description: 'Manual cache invalidation for administrators',
      supportedTypes: ['pattern', 'full'],
      examples: {
        patternInvalidation: {
          method: 'POST',
          body: {
            type: 'pattern',
            patterns: ['crimes:.*2024.*', 'crimes:type:january.*'],
            reason: 'Data corruption fix',
          },
        },
        fullInvalidation: {
          method: 'POST',
          body: {
            type: 'full',
            reason: 'System maintenance',
          },
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get invalidation info' }, { status: 500 });
  }
}
