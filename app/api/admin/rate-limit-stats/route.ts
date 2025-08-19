import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getRateLimitStats, clearRateLimitStore } from '@/lib/api';

/**
 * GET /api/admin/rate-limit-stats
 * Get current rate limiting statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: In a real app, you'd check for admin role here
    // For now, any authenticated user can access this (development only)

    const stats = getRateLimitStats();

    return NextResponse.json({
      rateLimitStats: stats,
      timestamp: new Date().toISOString(),
      environment: {
        rateLimitingEnabled: process.env.ENABLE_RATE_LIMITING === 'true',
        limits: {
          authenticated: process.env.RATE_LIMIT_AUTHENTICATED || '100',
          unauthenticated: process.env.RATE_LIMIT_UNAUTHENTICATED || '20',
          bulk: process.env.RATE_LIMIT_BULK_ENDPOINTS || '10',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch rate limit statistics' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/rate-limit-stats
 * Clear all rate limit data (useful for testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: In a real app, you'd check for admin role here
    clearRateLimitStore();

    return NextResponse.json({
      message: 'Rate limit store cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing rate limit store:', error);
    return NextResponse.json({ error: 'Failed to clear rate limit store' }, { status: 500 });
  }
}
