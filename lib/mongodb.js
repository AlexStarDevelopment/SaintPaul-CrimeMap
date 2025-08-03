import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Validate MongoDB URI is present
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Security-focused MongoDB options
const options = {
  maxPoolSize: 10, // Limit connection pool
  minPoolSize: 2,
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 10000, // Connection timeout
  retryWrites: true,
  w: 'majority', // Write concern for data consistency
};

let cachedClient = null;

export const connectToDatabase = async () => {
  if (cachedClient) return cachedClient;

  try {
    const client = await MongoClient.connect(uri, options);
    cachedClient = client;

    // Set up connection event handlers
    client.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      cachedClient = null;
    });

    client.on('close', () => {
      cachedClient = null;
    });

    return cachedClient;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
};

export const disconnectFromDatabase = async () => {
  if (cachedClient) {
    try {
      await cachedClient.close();
      cachedClient = null;
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
};
