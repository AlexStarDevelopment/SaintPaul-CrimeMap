import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Return minimal session information to prevent data leakage
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Only return essential user information
    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.user?.email,
        name: session.user?.name,
        image: session.user?.image,
        subscriptionTier: session.user?.subscriptionTier || 'free',
        theme: session.user?.theme,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'Session check failed',
      },
      { status: 500 }
    );
  }
}
