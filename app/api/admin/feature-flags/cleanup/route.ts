import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const client = await connectToDatabase();
    const db = client.db();
    const collection = db.collection('featureFlags');

    // Get current flags
    const currentFlags = await collection.find({}).toArray();
    console.log(
      'Current feature flags:',
      currentFlags.map((f) => ({ name: f.name, key: f.key, enabled: f.enabled }))
    );

    // Delete all existing feature flags
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} feature flags`);

    // Insert only the working feature flag
    const workingFlag = {
      name: 'Dashboard',
      key: 'dashboard',
      description: 'Enable the user dashboard.',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await collection.insertOne(workingFlag);
    console.log('Inserted working feature flag:', insertResult.insertedId);

    // Verify the result
    const finalFlags = await collection.find({}).toArray();

    return NextResponse.json({
      success: true,
      message: 'Feature flags cleaned up successfully',
      deleted: deleteResult.deletedCount,
      created: 1,
      finalFlags: finalFlags.map((f) => ({ name: f.name, key: f.key, enabled: f.enabled })),
    });
  } catch (error) {
    console.error('Error cleaning up feature flags:', error);
    return NextResponse.json({ error: 'Failed to cleanup feature flags' }, { status: 500 });
  }
}
