const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envLines = envFile.split('\n');
let MONGODB_URI = '';

envLines.forEach((line) => {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.split('=')[1];
  }
});

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function cleanupFeatureFlags() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('featureFlags');

    // Get current flags
    const currentFlags = await collection.find({}).toArray();
    console.log(
      'Current feature flags:',
      currentFlags.map((f) => ({ name: f.name, key: f.key, enabled: f.enabled }))
    );

    // Delete all existing feature flags
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} feature flags`);

    // Insert only the working feature flag
    const workingFlag = {
      name: 'Dashboard',
      key: 'dashboard',
      description: 'Enable the user dashboard.',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await collection.insertOne(workingFlag);
    console.log('Inserted working feature flag:', insertResult.insertedId);

    // Verify the result
    const finalFlags = await collection.find({}).toArray();
    console.log(
      'Final feature flags:',
      finalFlags.map((f) => ({ name: f.name, key: f.key, enabled: f.enabled }))
    );
  } catch (error) {
    console.error('Error cleaning up feature flags:', error);
  } finally {
    await client.close();
  }
}

cleanupFeatureFlags();
