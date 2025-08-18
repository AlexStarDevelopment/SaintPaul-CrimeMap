import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { updateUserTier } from '../../../../../../lib/users';
import { SubscriptionTier } from '../../../../../models/user';

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
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

    // Get request body
    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!tier || !['free', 'supporter', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: free, supporter, or pro' },
        { status: 400 }
      );
    }

    // Update user tier
    const updatedUser = await updateUserTier(params.userId, tier as SubscriptionTier);

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Error updating user tier:', error);
    return NextResponse.json({ error: 'Failed to update user tier' }, { status: 500 });
  }
}
