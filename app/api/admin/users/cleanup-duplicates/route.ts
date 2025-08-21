import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/db/mongodb';

export async function POST() {
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

    const client = await connectToDatabase();
    const db = client.db();
    const users = db.collection('users');

    // Find all users grouped by email
    const duplicates = await users
      .aggregate([
        {
          $group: {
            _id: '$email',
            count: { $sum: 1 },
            users: { $push: '$$ROOT' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    console.log(`Found ${duplicates.length} emails with duplicates`);

    let deletedCount = 0;
    let mergedCount = 0;

    for (const duplicate of duplicates) {
      const userRecords = duplicate.users;
      console.log(`Processing ${userRecords.length} duplicates for email: ${duplicate._id}`);

      // Sort by createdAt to keep the most recent one
      userRecords.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const keepUser = userRecords[0]; // Most recent
      const deleteUsers = userRecords.slice(1); // Older duplicates

      console.log(`Keeping user ${keepUser._id}, deleting ${deleteUsers.length} duplicates`);

      // Merge data from duplicates into the user we're keeping
      const mergedData = {
        subscriptionTier: keepUser.subscriptionTier || 'free',
        subscriptionStatus: keepUser.subscriptionStatus || 'active',
        isAdmin: keepUser.isAdmin || false,
        theme: keepUser.theme,
        updatedAt: new Date(),
      };

      // Check if any duplicate has better data
      for (const duplicate of deleteUsers) {
        if (duplicate.subscriptionTier && duplicate.subscriptionTier !== 'free' && !mergedData.subscriptionTier) {
          mergedData.subscriptionTier = duplicate.subscriptionTier;
        }
        if (duplicate.isAdmin) {
          mergedData.isAdmin = true;
        }
        if (duplicate.theme && !mergedData.theme) {
          mergedData.theme = duplicate.theme;
        }
      }

      // Update the user we're keeping with merged data
      await users.updateOne({ _id: keepUser._id }, { $set: mergedData });

      // Delete the duplicates
      for (const duplicate of deleteUsers) {
        await users.deleteOne({ _id: duplicate._id });
        deletedCount++;
      }

      mergedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate records for ${mergedCount} users`,
      deletedCount,
      mergedCount,
      duplicatesFound: duplicates.length,
    });
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json({ error: 'Failed to clean up duplicates' }, { status: 500 });
  }
}