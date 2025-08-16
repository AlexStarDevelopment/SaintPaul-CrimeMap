import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { updateUser } from '../../../../lib/users';
import { ThemeType } from '../../../models/user';
import { logger, getRequestContext, sanitizeUserForLogging } from '../../../../lib/logger';

export async function PUT(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      logger.security('Unauthorized theme update attempt', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { theme } = body;
    
    // Validate theme
    const validThemes: ThemeType[] = ['light', 'dark', 'sage', 'slate'];
    if (!validThemes.includes(theme)) {
      logger.warn('Invalid theme selection attempted', {
        ...context,
        userId: session.user.id,
        attemptedTheme: theme
      });
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }
    
    // Update user theme in database
    const updatedUser = await updateUser(session.user.id, { theme });
    
    if (!updatedUser) {
      logger.error('Failed to update user theme in database', null, {
        ...context,
        userId: session.user.id,
        theme
      });
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }
    
    logger.info('User theme updated successfully', {
      ...context,
      userId: session.user.id,
      newTheme: theme
    });
    
    return NextResponse.json({ 
      success: true, 
      theme: updatedUser.theme 
    });
  } catch (error) {
    logger.error('Theme update error', error, context);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}