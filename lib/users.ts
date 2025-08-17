import { connectToDatabase } from './mongodb.js';
import { User, SubscriptionTier, SubscriptionStatus } from '../app/models/user';
import { ObjectId } from 'mongodb';
import { logger, sanitizeUserForLogging } from './logger';

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db(); // Use default database from connection string
    const users = db.collection('users');

    // Try to find user by ObjectId
    let user = null;
    try {
      user = (await users.findOne({ _id: new ObjectId(id) })) as User | null;
    } catch (e) {
      // If ObjectId conversion fails, try string id
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
