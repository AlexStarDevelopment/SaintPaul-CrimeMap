import { connectToDatabase } from './mongodb.js';
import { User, SubscriptionTier, SubscriptionStatus } from '../app/models/user';
import { ObjectId } from 'mongodb';

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
    const users = db.collection('users');

    const user = (await users.findOne({ _id: new ObjectId(id) })) as User | null;
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
    const users = db.collection('users');

    const user = (await users.findOne({ email })) as User | null;
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
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
    console.error('Error creating user:', error);
    return null;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
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
    console.error('Error updating user:', error);
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
    const db = client.db('crimemap');
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
    console.error('Error updating user subscription:', error);
    return null;
  }
};

export const getUserByStripeCustomerId = async (stripeCustomerId: string): Promise<User | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
    const users = db.collection('users');

    const user = (await users.findOne({ stripeCustomerId })) as User | null;
    return user;
  } catch (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    return null;
  }
};

// Initialize database indexes for optimal performance
export const initializeUserIndexes = async (): Promise<void> => {
  try {
    const client = await connectToDatabase();
    const db = client.db('crimemap');
    const users = db.collection('users');

    // Create indexes for efficient queries
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ stripeCustomerId: 1 }, { sparse: true });
    await users.createIndex({ subscriptionTier: 1 });
    await users.createIndex({ subscriptionStatus: 1 });
    await users.createIndex({ createdAt: 1 });

    console.log('User collection indexes created successfully');
  } catch (error) {
    console.error('Error creating user indexes:', error);
  }
};
