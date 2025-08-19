import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllFeatureFlags, initializeFeatureFlags } from '@/lib';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Initialize flags if needed
    await initializeFeatureFlags();

    // Fetch all feature flags
    const flags = await getAllFeatureFlags();

    return NextResponse.json({
      flags,
      total: flags.length,
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}
