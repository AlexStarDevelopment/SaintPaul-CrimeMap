// Script to backfill missing createdAt fields for users in MongoDB
// Usage: node scripts/backfill-createdAt.js

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  if (line.startsWith('#') || !line.trim()) return;
  const equalIndex = line.indexOf('=');
  if (equalIndex > 0) {
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function backfillCreatedAt() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    // Find users missing createdAt or with invalid createdAt
    const query = {
      $or: [
        { createdAt: { $exists: false } },
        { createdAt: null },
        { createdAt: '' },
        { createdAt: { $type: 'string' } },
      ],
    };
    const cursor = users.find(query);
    let count = 0;
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      let newDate = user.updatedAt ? new Date(user.updatedAt) : new Date();
      if (isNaN(newDate.getTime())) newDate = new Date();
      await users.updateOne({ _id: user._id }, { $set: { createdAt: newDate } });
      count++;
      console.log(`Patched user ${user.email || user._id} with createdAt: ${newDate}`);
    }
    console.log(`Backfilled createdAt for ${count} users.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

backfillCreatedAt();
