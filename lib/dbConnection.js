import { connectToDatabase } from './mongodb.js';

/**
 * Database connection manager with enhanced connection pooling and reuse
 * This module provides additional optimizations beyond the basic MongoDB client
 */

/**
 * Shared database connection pool to minimize connection overhead
 * @type {Map<string, any>}
 */
const connectionPool = new Map();

/**
 * Connection statistics for monitoring
 */
let connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastAccessed: null,
};

/**
 * Get a database connection with enhanced pooling
 * @param {string} operation - Operation name for tracking (optional)
 * @returns {Promise<import('mongodb').MongoClient>}
 */
export async function getDbConnection(operation = 'unknown') {
  const cacheKey = 'main';
  connectionStats.lastAccessed = new Date();

  // Check if we have a cached connection
  if (connectionPool.has(cacheKey)) {
    connectionStats.cacheHits++;
    const cachedConnection = connectionPool.get(cacheKey);

    // Validate the connection is still healthy
    try {
      await cachedConnection.db().admin().ping();
      return cachedConnection;
    } catch (error) {
      console.warn('Cached MongoDB connection unhealthy, reconnecting:', error.message);
      connectionPool.delete(cacheKey);
    }
  }

  // Create new connection
  connectionStats.cacheMisses++;
  connectionStats.totalConnections++;

  try {
    const client = await connectToDatabase();
    connectionPool.set(cacheKey, client);
    connectionStats.activeConnections = connectionPool.size;

    console.log(`DB Connection established for operation: ${operation}`);
    return client;
  } catch (error) {
    console.error(`Failed to establish DB connection for operation: ${operation}`, error);
    throw error;
  }
}

/**
 * Execute a database operation with automatic connection management
 * @param {Function} operation - Database operation function that receives (db, client)
 * @param {string} operationName - Name for logging purposes
 * @returns {Promise<any>}
 */
export async function withDbConnection(operation, operationName = 'unknown') {
  const client = await getDbConnection(operationName);
  const db = client.db();

  try {
    return await operation(db, client);
  } catch (error) {
    console.error(`Database operation failed: ${operationName}`, error);
    throw error;
  }
  // Note: We intentionally don't close the connection here to allow reuse
}

/**
 * Execute multiple database operations in a single connection
 * @param {Array<{operation: Function, name: string}>} operations
 * @returns {Promise<Array<any>>}
 */
export async function batchDbOperations(operations) {
  const client = await getDbConnection('batch_operations');
  const db = client.db();

  const results = [];

  for (const { operation, name } of operations) {
    try {
      const result = await operation(db, client);
      results.push({ success: true, data: result, operationName: name });
    } catch (error) {
      console.error(`Batch operation failed: ${name}`, error);
      results.push({ success: false, error: error.message, operationName: name });
    }
  }

  return results;
}

/**
 * Get connection statistics for monitoring
 * @returns {Object}
 */
export function getConnectionStats() {
  return {
    ...connectionStats,
    poolSize: connectionPool.size,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Force cleanup of all cached connections (useful for testing or restart)
 */
export async function closeAllConnections() {
  for (const [key, client] of connectionPool.entries()) {
    try {
      await client.close();
      console.log(`Closed connection: ${key}`);
    } catch (error) {
      console.error(`Error closing connection ${key}:`, error);
    }
  }

  connectionPool.clear();
  connectionStats.activeConnections = 0;
  console.log('All database connections closed');
}

/**
 * Periodic cleanup of stale connections
 */
setInterval(async () => {
  const now = Date.now();
  const maxIdleTime = 300000; // 5 minutes

  for (const [key, client] of connectionPool.entries()) {
    // Check if connection has been idle too long
    if (
      connectionStats.lastAccessed &&
      now - connectionStats.lastAccessed.getTime() > maxIdleTime
    ) {
      try {
        await client.close();
        connectionPool.delete(key);
        connectionStats.activeConnections = connectionPool.size;
        console.log(`Cleaned up idle connection: ${key}`);
      } catch (error) {
        console.error(`Error cleaning up connection ${key}:`, error);
      }
    }
  }
}, 60000); // Run cleanup every minute

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await closeAllConnections();
  process.exit(0);
});
