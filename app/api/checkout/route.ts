import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { SubscriptionTier } from '@/types/user';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error('Checkout attempted without authentication');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tier } = body;

    console.log('Checkout request:', { tier, userId: session.user.id });

    if (!tier || !['supporter', 'pro'].includes(tier)) {
      console.error('Invalid tier:', tier);
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Get the price ID for the selected tier
    const priceId =
      tier === 'supporter'
        ? process.env.STRIPE_SUPPORTER_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID;

    console.log('Price ID check:', { tier, priceId: priceId ? 'set' : 'MISSING' });

    if (!priceId) {
      console.error(`Price ID not configured for tier: ${tier}`);
      return NextResponse.json(
        { error: 'Subscription tier not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    console.log('Base URL:', baseUrl);

    // Create Stripe checkout session
    console.log('Creating checkout session...');
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      priceId,
      successUrl: `${baseUrl}/account?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=canceled`,
    });

    console.log('Checkout session created:', checkoutSession.id);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    );
  }
}
