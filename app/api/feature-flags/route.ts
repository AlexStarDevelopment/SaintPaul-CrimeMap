import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFeatureFlags } from '@/lib';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // Return empty flags for unauthenticated users
      return NextResponse.json({ flags: {} });
    }

    // Get feature flags for this user
    const flags = await getUserFeatureFlags();

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching user feature flags:', error);
    return NextResponse.json(
      { flags: {} },
      { status: 200 } // Return empty flags instead of error
    );
  }
}
