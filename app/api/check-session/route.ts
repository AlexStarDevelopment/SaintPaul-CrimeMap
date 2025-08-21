import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { getUserById } from '../../../lib/services/users';

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

    // Fetch fresh user data from database
    const freshUserData = await getUserById(session.user.id);

    if (!freshUserData) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: 'User not found',
      });
    }

    // Return fresh user information from database
    return NextResponse.json({
      authenticated: true,
      user: {
        email: freshUserData.email,
        name: freshUserData.name,
        image: freshUserData.image,
        subscriptionTier: freshUserData.subscriptionTier || 'free',
        subscriptionStatus: freshUserData.subscriptionStatus || 'active',
        theme: freshUserData.theme,
        isAdmin: freshUserData.isAdmin || false,
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
