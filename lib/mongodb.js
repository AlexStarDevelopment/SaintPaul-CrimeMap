import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let cachedClient = null;

export const connectToDatabase = async () => {
  if (cachedClient) return cachedClient;
  console.log(uri);
  const client = await MongoClient.connect(uri, options);
  cachedClient = client;
  return cachedClient;
};
