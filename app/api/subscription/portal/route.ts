import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe';
import { getUserById } from '@/lib/services/users';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error('Portal: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Portal: Getting user for ID:', session.user.id);
    const user = await getUserById(session.user.id);

    if (!user) {
      console.error('Portal: User not found:', session.user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Portal: User found, stripeCustomerId:', user.stripeCustomerId || 'MISSING');

    if (!user?.stripeCustomerId) {
      console.error('Portal: No Stripe customer ID for user:', session.user.id);
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const returnUrl = `${baseUrl}/account`;

    console.log('Portal: Creating session for customer:', user.stripeCustomerId);
    console.log('Portal: Return URL:', returnUrl);

    const portalSession = await createPortalSession(user.stripeCustomerId, returnUrl);

    console.log('Portal: Session created successfully:', portalSession.id);

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Portal session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create portal session', details: errorMessage },
      { status: 500 }
    );
  }
}
