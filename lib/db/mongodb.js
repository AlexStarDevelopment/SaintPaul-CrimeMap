import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Validate MongoDB URI is present
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Pool configuration via env with safe defaults
const toInt = (val, def) => {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : def;
};

const options = {
  maxPoolSize: toInt(process.env.MONGODB_MAX_POOL_SIZE, 10),
  minPoolSize: toInt(process.env.MONGODB_MIN_POOL_SIZE, 0),
  maxIdleTimeMS: toInt(process.env.MONGODB_MAX_IDLE_MS, 30000),
  waitQueueTimeoutMS: toInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS, 5000),
  maxConnecting: toInt(process.env.MONGODB_MAX_CONNECTING, 2),
  serverSelectionTimeoutMS: toInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 5000),
  socketTimeoutMS: toInt(process.env.MONGODB_SOCKET_TIMEOUT_MS, 45000),
  connectTimeoutMS: toInt(process.env.MONGODB_CONNECT_TIMEOUT_MS, 10000),
  retryWrites: true,
  w: 'majority',
  appName: process.env.NEXT_PUBLIC_SITE_URL || 'saint-paul-crime-map',
};

let cachedClient = null;
let cachedPromise = null;

export const clientPromise = (() => {
  if (!cachedPromise) {
    cachedPromise = MongoClient.connect(uri, options).then((client) => {
      // wire events once
      client.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        cachedClient = null;
      });
      client.on('close', () => {
        cachedClient = null;
      });
      cachedClient = client;
      return client;
    });
  }
  return cachedPromise;
})();

export const connectToDatabase = async () => {
  // Always reuse the shared promise to avoid new connections
  return clientPromise;
};

export const disconnectFromDatabase = async () => {
  if (cachedClient) {
    try {
      await cachedClient.close();
      cachedClient = null;
      cachedPromise = null;
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
};
