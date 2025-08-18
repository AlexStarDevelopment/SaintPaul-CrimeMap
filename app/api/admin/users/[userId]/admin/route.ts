import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { setUserAdmin } from '../../../../../../lib/users';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // Await params
    const { userId } = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Prevent self-demotion
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin must be a boolean value' }, { status: 400 });
    }

    // Update user admin status
    const updatedUser = await setUserAdmin(userId, isAdmin);

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    return NextResponse.json({ error: 'Failed to update user admin status' }, { status: 500 });
  }
}
