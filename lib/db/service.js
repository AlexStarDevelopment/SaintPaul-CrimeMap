import { withDbConnection, batchDbOperations } from './connection.js';

/**
 * Consolidated database service to reduce connection overhead
 * Groups related operations and provides batch processing capabilities
 */

/**
 * User-related database operations
 */
export const UserService = {
  /**
   * Get user by ID and update theme in one operation
   * @param {string} userId
   * @param {string} newTheme
   */
  async getUserAndUpdateTheme(userId, newTheme) {
    return withDbConnection(async (db) => {
      const users = db.collection('users');

      // Use findOneAndUpdate for atomic operation
      const result = await users.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            theme: newTheme,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          upsert: false,
        }
      );

      return result.value;
    }, 'user_get_and_update_theme');
  },

  /**
   * Batch user operations
   * @param {string} userId
   */
  async getUserDashboardData(userId) {
    return withDbConnection(async (db) => {
      const users = db.collection('users');
      const locations = db.collection('locations');

      // Execute multiple queries in parallel using the same connection
      const [user, userLocations] = await Promise.all([
        users.findOne({ _id: userId }),
        locations
          .find({
            userId: userId,
            isActive: true,
          })
          .toArray(),
      ]);

      return {
        user,
        locations: userLocations,
      };
    }, 'user_dashboard_data');
  },
};

/**
 * Location-related database operations
 */
export const LocationService = {
  /**
   * Create location and update user location count atomically
   * @param {Object} locationData
   * @param {string} userId
   */
  async createLocationWithUserUpdate(locationData, userId) {
    return withDbConnection(async (db) => {
      const locations = db.collection('locations');
      const users = db.collection('users');

      // Start a session for transaction
      const session = db.client.startSession();

      try {
        await session.withTransaction(async () => {
          // Insert new location
          const locationResult = await locations.insertOne(locationData, { session });

          // Update user's location count
          await users.updateOne(
            { _id: userId },
            {
              $inc: { locationCount: 1 },
              $set: { updatedAt: new Date() },
            },
            { session }
          );

          return {
            ...locationData,
            _id: locationResult.insertedId,
          };
        });
      } finally {
        await session.endSession();
      }
    }, 'location_create_with_user_update');
  },

  /**
   * Get all user locations with stats in one query
   * @param {string} userId
   */
  async getUserLocationsWithStats(userId) {
    return withDbConnection(async (db) => {
      const locations = db.collection('locations');

      // Use aggregation to get locations with computed stats
      const pipeline = [
        {
          $match: {
            userId: userId,
            isActive: true,
          },
        },
        {
          $addFields: {
            createdDaysAgo: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                86400000, // milliseconds in a day
              ],
            },
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
      ];

      return await locations.aggregate(pipeline).toArray();
    }, 'user_locations_with_stats');
  },

  /**
   * Batch location operations
   * @param {Array} operations
   */
  async batchLocationOperations(operations) {
    return batchDbOperations(
      operations.map((op) => ({
        operation: async (db) => {
          const locations = db.collection('locations');

          switch (op.type) {
            case 'update':
              return await locations.updateOne(
                { _id: op.locationId, userId: op.userId },
                { $set: { ...op.updates, updatedAt: new Date() } }
              );
            case 'delete':
              return await locations.updateOne(
                { _id: op.locationId, userId: op.userId },
                { $set: { isActive: false, updatedAt: new Date() } }
              );
            default:
              throw new Error(`Unknown operation type: ${op.type}`);
          }
        },
        name: `location_${op.type}_${op.locationId}`,
      }))
    );
  },
};

/**
 * Crime data operations with optimized queries
 */
export const CrimeService = {
  /**
   * Get crime statistics for multiple locations in one query
   * @param {Array} locations - Array of location objects with coordinates and radius
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async getCrimeStatsForLocations(locations, startDate, endDate) {
    return withDbConnection(async (db) => {
      const crimes = db.collection('crimes');

      // Create aggregation pipeline for all locations
      const locationQueries = locations.map((location) => ({
        locationId: location._id,
        query: {
          'crimes.DATE': {
            $gte: startDate.getTime(),
            $lte: endDate.getTime(),
          },
          'crimes.LAT': { $ne: null },
          'crimes.LON': { $ne: null },
          $expr: {
            $lte: [
              {
                $multiply: [
                  3959, // Earth radius in miles
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [
                            {
                              $sin: {
                                $multiply: [{ $divide: [location.coordinates.lat, 180] }, 3.14159],
                              },
                            },
                            { $sin: { $multiply: [{ $divide: ['$crimes.LAT', 180] }, 3.14159] } },
                          ],
                        },
                        {
                          $multiply: [
                            {
                              $cos: {
                                $multiply: [{ $divide: [location.coordinates.lat, 180] }, 3.14159],
                              },
                            },
                            { $cos: { $multiply: [{ $divide: ['$crimes.LAT', 180] }, 3.14159] } },
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $subtract: [location.coordinates.lng, '$crimes.LON'] },
                                      180,
                                    ],
                                  },
                                  3.14159,
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
              location.radius,
            ],
          },
        },
      }));

      // Execute all queries in parallel
      const results = await Promise.all(
        locationQueries.map(async ({ locationId, query }) => {
          const crimeData = await crimes.find(query).toArray();
          const flatCrimes = crimeData.flatMap((doc) => doc.crimes || []);

          return {
            locationId,
            totalCrimes: flatCrimes.length,
            crimesByType: flatCrimes.reduce((acc, crime) => {
              const type = crime.INCIDENT || 'Unknown';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}),
            crimes: flatCrimes,
          };
        })
      );

      return results;
    }, 'crime_stats_multiple_locations');
  },
};

/**
 * Combined service for dashboard data that fetches everything needed in minimal queries
 */
export const DashboardService = {
  /**
   * Get complete dashboard data for a user and location
   * @param {string} userId
   * @param {string} locationId
   * @param {string} period
   */
  async getCompleteDashboardData(userId, locationId, period) {
    return withDbConnection(async (db) => {
      const users = db.collection('users');
      const locations = db.collection('locations');
      const crimes = db.collection('crimes');

      // Calculate date ranges
      const end = new Date();
      const start = new Date();

      switch (period) {
        case '7d':
          start.setDate(start.getDate() - 7);
          break;
        case '90d':
          start.setDate(start.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setDate(start.getDate() - 30);
      }

      // Execute all queries in parallel
      const [user, location, crimeData] = await Promise.all([
        users.findOne({ _id: userId }),
        locations.findOne({
          _id: locationId,
          userId: userId,
          isActive: true,
        }),
        crimes
          .find({
            'crimes.DATE': {
              $gte: start.getTime(),
              $lte: end.getTime(),
            },
          })
          .toArray(),
      ]);

      if (!location) {
        throw new Error('Location not found');
      }

      // Process crime data for this location
      const flatCrimes = crimeData.flatMap((doc) => doc.crimes || []);
      const crimesInRadius = flatCrimes.filter((crime) => {
        if (!crime.LAT || !crime.LON) return false;

        // Simple distance calculation (could be optimized further)
        const lat1 = location.coordinates.lat;
        const lon1 = location.coordinates.lng;
        const lat2 = parseFloat(crime.LAT);
        const lon2 = parseFloat(crime.LON);

        const R = 3959; // Earth radius in miles
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return distance <= location.radius;
      });

      return {
        user,
        location,
        crimes: crimesInRadius,
        totalCrimes: crimesInRadius.length,
        period,
        dateRange: { start, end },
      };
    }, 'complete_dashboard_data');
  },
};

/**
 * Get connection and performance statistics
 */
export async function getDbServiceStats() {
  const { getConnectionStats } = await import('./connection.js');
  return getConnectionStats();
}
