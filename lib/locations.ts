import { connectToDatabase } from './mongodb.js';
import { SavedLocation, LOCATION_LIMITS } from '../app/models/location';
import { SubscriptionTier } from '../app/models/user';
import { ObjectId } from 'mongodb';
import { logger } from './logger';

export const getUserLocations = async (userId: string): Promise<SavedLocation[]> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    const userLocations = await locations.find({ userId }).sort({ createdAt: -1 }).toArray();

    return userLocations as unknown as SavedLocation[];
  } catch (error) {
    logger.error('Error fetching user locations', error, { userId });
    return [];
  }
};

export const getLocationById = async (
  locationId: string,
  userId: string
): Promise<SavedLocation | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    const location = await locations.findOne({
      _id: new ObjectId(locationId),
      userId, // Ensure user owns this location
    });

    return location as unknown as SavedLocation;
  } catch (error) {
    logger.error('Error fetching location by ID', error, { userId });
    return null;
  }
};

export const createLocation = async (
  locationData: Omit<SavedLocation, '_id' | 'createdAt' | 'updatedAt'>,
  userTier: SubscriptionTier
): Promise<SavedLocation | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    // Check location limit for user tier
    const existingCount = await locations.countDocuments({
      userId: locationData.userId,
    });
    const limit = LOCATION_LIMITS[userTier];

    if (limit !== -1 && existingCount >= limit) {
      throw new Error(`Location limit reached for ${userTier} tier (${limit} locations)`);
    }

    const now = new Date();
    const newLocation = {
      ...locationData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await locations.insertOne(newLocation as any);

    if (result.insertedId) {
      return {
        ...newLocation,
        _id: result.insertedId.toString(),
      } as SavedLocation;
    }

    return null;
  } catch (error) {
    logger.error('Error creating location', error, {
      userId: locationData.userId,
    });
    throw error;
  }
};

export const updateLocation = async (
  locationId: string,
  userId: string,
  updates: Partial<SavedLocation>
): Promise<SavedLocation | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    // Remove fields that shouldn't be updated
    const { _id, userId: _, createdAt, ...updateData } = updates;

    const result = await locations.findOneAndUpdate(
      { _id: new ObjectId(locationId), userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result as unknown as SavedLocation;
  } catch (error) {
    logger.error('Error updating location', error, { userId });
    return null;
  }
};

export const deleteLocation = async (locationId: string, userId: string): Promise<boolean> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    const result = await locations.deleteOne({
      _id: new ObjectId(locationId),
      userId,
    });

    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting location', error, { userId });
    return false;
  }
};

// Initialize database indexes for optimal performance
export const initializeLocationIndexes = async (): Promise<void> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const locations = db.collection('saved_locations');

    // Create indexes for efficient queries
    await locations.createIndex({ userId: 1 });
    await locations.createIndex({ coordinates: '2dsphere' }); // For geospatial queries
    await locations.createIndex({ createdAt: 1 });

    logger.info('Location collection indexes created successfully');
  } catch (error) {
    logger.error('Error creating location indexes', error);
  }
};
