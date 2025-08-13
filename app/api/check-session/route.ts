import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      session: session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 });
  }
}