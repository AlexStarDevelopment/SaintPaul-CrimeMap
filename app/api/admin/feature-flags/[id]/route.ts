import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { toggleFeatureFlag, updateFeatureFlag } from '../../../../../lib/featureFlags';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params
    const { id } = await params;

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, ...otherUpdates } = body;

    let updatedFlag;

    // If only toggling enabled status
    if (enabled !== undefined && Object.keys(otherUpdates).length === 0) {
      updatedFlag = await toggleFeatureFlag(id, enabled);
    } else {
      // Update other properties
      updatedFlag = await updateFeatureFlag(id, body);
    }

    if (!updatedFlag) {
      return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
    }

    return NextResponse.json({
      flag: updatedFlag,
      message: 'Feature flag updated successfully',
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
