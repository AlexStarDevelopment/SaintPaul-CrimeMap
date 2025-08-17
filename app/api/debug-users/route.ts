import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/mongodb';

export async function GET() {
  // Multiple security checks for debug endpoint
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // Require authentication for debug access
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Additional check: only allow specific admin emails in development
  const adminEmails = process.env.DEBUG_ADMIN_EMAILS?.split(',') || [];
  if (adminEmails.length > 0 && !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();

    // Get limited user data (remove sensitive fields)
    const users = await db
      .collection('users')
      .find(
        {},
        {
          projection: {
            stripeCustomerId: 0,
            stripeSubscriptionId: 0,
            _id: 0,
          },
        }
      )
      .toArray();

    // Get current session user if logged in
    const currentUser = await db.collection('users').findOne(
      { email: session.user.email },
      {
        projection: { stripeCustomerId: 0, stripeSubscriptionId: 0, _id: 0 },
      }
    );

    await client.close();

    return NextResponse.json({
      totalUsers: users.length,
      currentUser: currentUser || 'Not found',
      allUsers: users.map((u) => ({
        email: u.email,
        name: u.name,
        emailVerified: u.emailVerified,
        subscriptionTier: u.subscriptionTier || 'free',
        subscriptionStatus: u.subscriptionStatus || 'active',
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
}
