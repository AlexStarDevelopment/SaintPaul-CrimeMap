import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { SubscriptionTier } from '@/types/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tier } = body;

    if (!tier || !['supporter', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Get the price ID for the selected tier
    const priceId =
      tier === 'supporter'
        ? process.env.STRIPE_SUPPORTER_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      console.error(`Price ID not configured for tier: ${tier}`);
      return NextResponse.json({ error: 'Subscription tier not configured' }, { status: 500 });
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      priceId,
      successUrl: `${baseUrl}/account?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=canceled`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
