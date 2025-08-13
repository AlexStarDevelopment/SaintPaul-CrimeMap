import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { MongoClient } from 'mongodb';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db();
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    // Get current session user if logged in
    const currentUser = session?.user?.email 
      ? await db.collection('users').findOne({ email: session.user.email })
      : null;
    
    await client.close();
    
    return NextResponse.json({
      totalUsers: users.length,
      currentUser: currentUser || 'Not logged in',
      allUsers: users.map(u => ({
        id: u._id,
        email: u.email,
        name: u.name,
        image: u.image,
        emailVerified: u.emailVerified,
        subscriptionTier: u.subscriptionTier || 'free',
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}