import { connectToDatabase } from './mongodb';
import { FeatureFlag, DEFAULT_FEATURE_FLAGS } from '../app/models/featureFlag';
import { ObjectId } from 'mongodb';
import { logger } from './logger';

// Initialize feature flags in database if they don't exist
export const initializeFeatureFlags = async (): Promise<void> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const flags = db.collection('featureFlags');

    // Check if flags exist
    const existingFlags = await flags.countDocuments();

    if (existingFlags === 0) {
      // Insert default flags
      const now = new Date();
      const flagsToInsert = DEFAULT_FEATURE_FLAGS.map((flag) => ({
        ...flag,
        createdAt: now,
        updatedAt: now,
      }));

      await flags.insertMany(flagsToInsert);
      logger.info('Feature flags initialized with defaults');
    }

    // Create index on key for fast lookups
    await flags.createIndex({ key: 1 }, { unique: true });
  } catch (error) {
    logger.error('Error initializing feature flags', error);
  }
};

// Get all feature flags
export const getAllFeatureFlags = async (): Promise<FeatureFlag[]> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const flags = db.collection('featureFlags');

    const flagList = await flags.find({}).sort({ name: 1 }).toArray();

    return flagList as unknown as FeatureFlag[];
  } catch (error) {
    logger.error('Error fetching feature flags', error);
    return [];
  }
};

// Get a specific feature flag by key
export const getFeatureFlag = async (key: string): Promise<FeatureFlag | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const flags = db.collection('featureFlags');

    const flag = await flags.findOne({ key });
    return flag as FeatureFlag | null;
  } catch (error) {
    logger.error('Error fetching feature flag', error);
    return null;
  }
};

// Check if a feature is enabled for a user
export const isFeatureEnabled = async (key: string): Promise<boolean> => {
  try {
    const flag = await getFeatureFlag(key);
    return !!(flag && flag.enabled);
  } catch (error) {
    logger.error('Error checking feature flag', error);
    return false;
  }
};

// Toggle a feature flag (admin only)
export const toggleFeatureFlag = async (
  flagId: string,
  enabled: boolean
): Promise<FeatureFlag | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const flags = db.collection('featureFlags');

    const result = await flags.findOneAndUpdate(
      { _id: new ObjectId(flagId) },
      {
        $set: {
          enabled,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    logger.info('Feature flag toggled');
    return result as FeatureFlag | null;
  } catch (error) {
    logger.error('Error toggling feature flag', error);
    return null;
  }
};

// Update feature flag settings (admin only)
export const updateFeatureFlag = async (
  flagId: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag | null> => {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const flags = db.collection('featureFlags');

    // Remove fields that shouldn't be updated
    const { _id, key, createdAt, ...safeUpdates } = updates;

    const result = await flags.findOneAndUpdate(
      { _id: new ObjectId(flagId) },
      {
        $set: {
          ...safeUpdates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    logger.info('Feature flag updated');
    return result as FeatureFlag | null;
  } catch (error) {
    logger.error('Error updating feature flag', error);
    return null;
  }
};

// Get feature flags for a specific user
export const getUserFeatureFlags = async (): Promise<Record<string, boolean>> => {
  try {
    const dashboard = await isFeatureEnabled('dashboard');
    return { dashboard };
  } catch (error) {
    logger.error('Error getting user feature flags', error);
    return { dashboard: false } as Record<string, boolean>;
  }
};

// Small in-memory cache for dashboard flag
let dashboardCache: { value: boolean; expiresAt: number } | null = null;
const DASHBOARD_TTL_MS = 15_000;

export async function isDashboardEnabledCached(): Promise<boolean> {
  const now = Date.now();
  if (dashboardCache && dashboardCache.expiresAt > now) {
    return dashboardCache.value;
  }
  const value = await isFeatureEnabled('dashboard');
  dashboardCache = { value, expiresAt: now + DASHBOARD_TTL_MS };
  return value;
}
