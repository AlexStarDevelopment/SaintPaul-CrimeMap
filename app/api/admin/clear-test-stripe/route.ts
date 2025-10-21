import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUser } from '@/lib/services/users';

/**
 * Admin endpoint to clear test mode Stripe IDs from user accounts
 * This is needed when switching from test to live mode
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Clearing test Stripe IDs for user:', session.user.id);

    // Clear the test Stripe customer and subscription IDs
    await updateUser(session.user.id, {
      stripeCustomerId: undefined,
      stripeSubscriptionId: undefined,
    });

    console.log('Successfully cleared Stripe IDs for user:', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Test Stripe IDs cleared. You can now create a live subscription.',
    });
  } catch (error) {
    console.error('Error clearing Stripe IDs:', error);
    return NextResponse.json(
      { error: 'Failed to clear Stripe IDs' },
      { status: 500 }
    );
  }
}
