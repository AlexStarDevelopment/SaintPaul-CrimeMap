import { connectToDatabase } from '../db/mongodb.js';
import { User, SubscriptionTier, SubscriptionStatus } from '@/types';
import { ObjectId } from 'mongodb';
import { logger, sanitizeUserForLogging } from '../logger';

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database from connection string
    const users = db.collection('users');

    // NextAuth passes hex string IDs, which should be converted to ObjectId
    let user = null;

    // If ID is 24 characters (hex string), convert to ObjectId
    if (id.length === 24) {
      try {
        user = (await users.findOne({ _id: new ObjectId(id) })) as User | null;
      } catch (e: any) {
        // ObjectId conversion failed, continue to try as string
      }
    }

    // If not found and not a hex string, try as-is (legacy string IDs)
    if (!user) {
      user = (await users.findOne({ _id: id as any })) as User | null;
    }

    // If user found, ensure they have required fields
    if (user && !user.subscriptionTier) {
      user.subscriptionTier = 'free';
      user.subscriptionStatus = 'active';
      // Update in database
      const filter =
        typeof user._id === 'string' ? { _id: new ObjectId(user._id) } : { _id: user._id };
      await users.updateOne(filter, {
        $set: { subscriptionTier: 'free', subscriptionStatus: 'active' },
      });
    }

    return user;
  } catch (error) {
    logger.error('Error fetching user by ID', error, { userId: id });
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    const user = (await users.findOne({ email })) as User | null;
    return user;
  } catch (error) {
    logger.error('Error fetching user by email', error, { email });
    return null;
  }
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    const now = new Date();
    const user: Omit<User, '_id'> = {
      email: userData.email!,
      name: userData.name,
      image: userData.image,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(user as any);

    if (result.insertedId) {
      return { ...user, _id: result.insertedId.toString() };
    }

    return null;
  } catch (error) {
    logger.error('Error creating user', error, {
      email: userData.email,
    });
    return null;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result as User | null;
  } catch (error) {
    logger.error('Error updating user', error, { userId: id });
    return null;
  }
};

export const updateUserSubscription = async (
  userId: string,
  subscriptionData: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionEndDate?: Date;
    trialEndDate?: Date;
  }
): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    const updates: Partial<User> = {
      subscriptionTier: subscriptionData.tier,
      subscriptionStatus: subscriptionData.status,
      updatedAt: new Date(),
    };

    if (subscriptionData.stripeCustomerId) {
      updates.stripeCustomerId = subscriptionData.stripeCustomerId;
    }

    if (subscriptionData.stripeSubscriptionId) {
      updates.stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
    }

    if (subscriptionData.subscriptionEndDate) {
      updates.subscriptionEndDate = subscriptionData.subscriptionEndDate;
    }

    if (subscriptionData.trialEndDate) {
      updates.trialEndDate = subscriptionData.trialEndDate;
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return result as User | null;
  } catch (error) {
    logger.error('Error updating user subscription', error, {
      userId,
    });
    return null;
  }
};

export const getUserByStripeCustomerId = async (stripeCustomerId: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    const user = (await users.findOne({ stripeCustomerId })) as User | null;
    return user;
  } catch (error) {
    logger.error('Error fetching user by Stripe customer ID', error);
    return null;
  }
};

// Initialize database indexes for optimal performance
export const initializeUserIndexes = async (): Promise<void> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database
    const users = db.collection('users');

    // Create indexes for efficient queries
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ stripeCustomerId: 1 }, { sparse: true });
    await users.createIndex({ subscriptionTier: 1 });
    await users.createIndex({ subscriptionStatus: 1 });
    await users.createIndex({ createdAt: 1 });

    logger.info('User collection indexes created successfully');
  } catch (error) {
    logger.error('Error creating user indexes', error);
  }
};

// Admin functions for user management
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const users = db.collection('users');

    const userList = await users.find({}).sort({ createdAt: -1 }).toArray();

    // Deduplicate users by email, keeping the most recent one
    const seenEmails = new Set<string>();
    const uniqueUsers = [];

    for (const user of userList as unknown as User[]) {
      if (user.email && !seenEmails.has(user.email)) {
        seenEmails.add(user.email);
        uniqueUsers.push(user);
      }
    }

    return uniqueUsers;
  } catch (error) {
    logger.error('Error fetching all users', error);
    return [];
  }
};

export const updateUserTier = async (
  userId: string,
  tier: SubscriptionTier
): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const users = db.collection('users');

    let targetUser = null;

    // First, find the user to get their email
    if (userId.length === 24) {
      try {
        targetUser = await users.findOne({ _id: new ObjectId(userId) });
      } catch (e: any) {
        // ObjectId conversion failed, continue to try as string
      }
    }

    if (!targetUser) {
      targetUser = await users.findOne({ _id: userId as any });
    }

    if (!targetUser) {
      logger.error('User not found for tier update', { userId });
      return null;
    }

    // Update ALL records with this email (to handle duplicates)
    const updateData = {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    };

    // Update by email to catch all duplicates
    await users.updateMany({ email: targetUser.email }, { $set: updateData });

    // Also update by ID to be sure
    if (userId.length === 24) {
      try {
        await users.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
      } catch (e: any) {
        // ObjectId conversion failed, ignore
      }
    }
    await users.updateOne({ _id: userId as any }, { $set: updateData });

    // Return the updated user
    const result = await users.findOne({ _id: targetUser._id });

    if (result) {
      logger.info('User tier updated by admin (including duplicates)', {
        userId,
        email: targetUser.email,
      });
    }

    return result as User | null;
  } catch (error) {
    logger.error('Error updating user tier', error, { userId });
    return null;
  }
};

export const setUserAdmin = async (userId: string, isAdmin: boolean): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const users = db.collection('users');

    // Try string format first (NextAuth format)
    let result = await users.findOneAndUpdate(
      { _id: userId as any },
      {
        $set: {
          isAdmin,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    // If not found with string, try ObjectId format (legacy records)
    if (!result) {
      try {
        result = await users.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          {
            $set: {
              isAdmin,
              updatedAt: new Date(),
            },
          },
          { returnDocument: 'after' }
        );
      } catch (e) {
        // ObjectId conversion failed, ignore
      }
    }

    logger.info('User admin status updated', { userId });
    return result as User | null;
  } catch (error) {
    logger.error('Error updating user admin status', error, { userId });
    return null;
  }
};
