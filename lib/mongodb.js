import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let cachedClient = null;

export const connectToDatabase = async () => {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(uri, options);
  cachedClient = client;
  return cachedClient;
};
