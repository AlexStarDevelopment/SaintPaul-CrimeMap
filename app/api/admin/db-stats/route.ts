import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbServiceStats } from '@/lib/db';

/**
 * GET /api/admin/db-stats
 * Get database connection and performance statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: In a real app, you'd check for admin role here
    const stats = await getDbServiceStats();

    return NextResponse.json({
      databaseStats: stats,
      recommendations: generateRecommendations(stats),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json({ error: 'Failed to fetch database statistics' }, { status: 500 });
  }
}

/**
 * Generate optimization recommendations based on connection stats
 */
function generateRecommendations(stats: any) {
  const recommendations = [];

  if (stats.cacheMisses > stats.cacheHits) {
    recommendations.push({
      type: 'performance',
      message: 'High cache miss ratio detected. Consider implementing connection pooling.',
      severity: 'medium',
    });
  }

  if (stats.totalConnections > 50) {
    recommendations.push({
      type: 'scalability',
      message: 'High number of total connections. Consider batching operations.',
      severity: 'high',
    });
  }

  if (stats.poolSize > 5) {
    recommendations.push({
      type: 'resource',
      message: 'Large connection pool size. Monitor for memory usage.',
      severity: 'low',
    });
  }

  if (stats.cacheMisses === 0 && stats.cacheHits > 10) {
    recommendations.push({
      type: 'optimization',
      message: 'Excellent connection reuse! Connection pooling is working well.',
      severity: 'info',
    });
  }

  return recommendations;
}
