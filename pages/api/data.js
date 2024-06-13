import { connectToDatabase } from "../../lib/mongodb";

export default async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db();
  const collection = db.collection("crimes");

  const data = await collection.find({}).toArray();
  res.status(200).json(data);
};
