/* eslint-disable import/no-anonymous-default-export */
import { connectToDatabase } from "../../../lib/mongodb";

export default async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db();
  const collection = db.collection("crimes");

  const data = await collection.find({ month: "all", year: 2023 }).toArray();
  res.status(200).json(data);
};
