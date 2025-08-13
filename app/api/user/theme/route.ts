import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { updateUser } from '../../../../lib/users';
import { ThemeType } from '../../../models/user';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { theme } = body;
    
    // Validate theme
    const validThemes: ThemeType[] = ['light', 'dark', 'sage', 'slate'];
    if (!validThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }
    
    // Update user theme in database
    const updatedUser = await updateUser(session.user.id, { theme });
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      theme: updatedUser.theme 
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}