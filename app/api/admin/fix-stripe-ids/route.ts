import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateUser } from '@/lib/services/users';

/**
 * Admin endpoint to fix Stripe IDs after webhook processing failed
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, subscriptionId } = body;

    if (!customerId || !subscriptionId) {
      return NextResponse.json(
        { error: 'customerId and subscriptionId required' },
        { status: 400 }
      );
    }

    console.log('Updating Stripe IDs for user:', session.user.id);
    console.log('Customer ID:', customerId);
    console.log('Subscription ID:', subscriptionId);

    await updateUser(session.user.id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: 'supporter',
    });

    console.log('Successfully updated Stripe IDs for user:', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Stripe IDs updated successfully',
    });
  } catch (error) {
    console.error('Error updating Stripe IDs:', error);
    return NextResponse.json({ error: 'Failed to update Stripe IDs' }, { status: 500 });
  }
}
