// Script to make a user an admin
// Run with: node scripts/make-admin.js <email>

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  // Skip comments and empty lines
  if (line.startsWith('#') || !line.trim()) return;

  // Split only on first = to handle values with = in them
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

async function makeUserAdmin(email) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    // Find user by email
    const user = await users.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    // Update user to be admin
    const result = await users.updateOne(
      { email },
      {
        $set: {
          isAdmin: true,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully made ${email} an admin`);
      console.log(`User: ${user.name || 'No name'} (${user.email})`);
    } else {
      console.log(`User ${email} is already an admin`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(email).then(() => process.exit(0));
