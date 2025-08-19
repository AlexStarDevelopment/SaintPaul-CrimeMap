import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getAllUsers } from '@/lib/services';

export async function GET(request: NextRequest) {
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

    // Fetch all users
    const users = await getAllUsers();

    // Remove sensitive data before sending
    const sanitizedUsers = users.map((user) => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      total: sanitizedUsers.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
