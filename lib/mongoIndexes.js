import { connectToDatabase } from './mongodb.js';

/**
 * Creates MongoDB indexes for optimal query performance
 * Run this during application initialization or as a separate setup script
 * @async
 * @returns {Promise<void>}
 */
export async function createIndexes() {
  try {
    const client = await connectToDatabase();
    const db = client.db();

    console.log('Creating MongoDB indexes...');

    // Indexes for crimes collection
    const crimes = db.collection('crimes');

    // Compound index for date range queries
    await crimes.createIndex(
      { 'crimes.DATE': 1 },
      {
        name: 'crime_date_idx',
        background: true,
      }
    );

    // Geospatial index for location-based queries
    await crimes.createIndex(
      { 'crimes.location': '2dsphere' },
      {
        name: 'crime_location_2dsphere_idx',
        background: true,
        sparse: true,
      }
    );

    // Index for incident type queries
    await crimes.createIndex(
      { 'crimes.INCIDENT': 1 },
      {
        name: 'crime_incident_type_idx',
        background: true,
      }
    );

    // Compound index for date + location queries (most common)
    await crimes.createIndex(
      { 'crimes.DATE': 1, 'crimes.LAT': 1, 'crimes.LON': 1 },
      {
        name: 'crime_date_location_compound_idx',
        background: true,
      }
    );

    // Indexes for users collection
    const users = db.collection('users');

    // Unique index on email
    await users.createIndex(
      { email: 1 },
      {
        name: 'user_email_unique_idx',
        unique: true,
        background: true,
      }
    );

    // Index for subscription queries
    await users.createIndex(
      { subscriptionTier: 1, subscriptionStatus: 1 },
      {
        name: 'user_subscription_idx',
        background: true,
      }
    );

    // Indexes for locations collection
    const locations = db.collection('locations');

    // Index for user's locations
    await locations.createIndex(
      { userId: 1, isActive: 1 },
      {
        name: 'location_user_active_idx',
        background: true,
      }
    );

    // Geospatial index for location coordinates
    await locations.createIndex(
      { coordinates: '2dsphere' },
      {
        name: 'location_coordinates_2dsphere_idx',
        background: true,
      }
    );

    // Index for location updates
    await locations.createIndex(
      { updatedAt: -1 },
      {
        name: 'location_updated_idx',
        background: true,
      }
    );

    console.log('MongoDB indexes created successfully');

    // List all indexes for verification
    if (process.env.NODE_ENV === 'development') {
      console.log('\nCrimes collection indexes:');
      const crimeIndexes = await crimes.listIndexes().toArray();
      crimeIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

      console.log('\nUsers collection indexes:');
      const userIndexes = await users.listIndexes().toArray();
      userIndexes.forEach((idx) => console.log(`  - ${idx.name}`));

      console.log('\nLocations collection indexes:');
      const locationIndexes = await locations.listIndexes().toArray();
      locationIndexes.forEach((idx) => console.log(`  - ${idx.name}`));
    }
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    // Don't throw - indexes are optimization, not critical for operation
  }
}

/**
 * Analyzes query performance and suggests optimizations
 * @async
 * @param {string} collection - Collection name
 * @param {Object} query - MongoDB query object
 * @returns {Promise<Object>} Query explanation
 */
export async function analyzeQuery(collection, query) {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    const coll = db.collection(collection);

    const explanation = await coll.find(query).explain('executionStats');

    const stats = {
      executionTimeMs: explanation.executionStats.executionTimeMillis,
      totalDocsExamined: explanation.executionStats.totalDocsExamined,
      totalDocsReturned: explanation.executionStats.nReturned,
      indexUsed: explanation.executionStats.executionStages.indexName || 'NONE',
      isOptimal:
        explanation.executionStats.totalDocsExamined === explanation.executionStats.nReturned,
    };

    if (!stats.isOptimal) {
      console.warn(`Query performance warning for ${collection}:`, {
        query,
        stats,
        suggestion: 'Consider adding an index for this query pattern',
      });
    }

    return stats;
  } catch (error) {
    console.error('Error analyzing query:', error);
    return null;
  }
}
