/* eslint-disable import/no-anonymous-default-export */
import { connectToDatabase } from "../../lib/mongodb";

export default async (req, res) => {
  const { type = "june", year = 2024, page = 1, limit = 20000 } = req.query;

  // Convert page and limit to integers
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const typeString = type.toString();
  const yearInt = parseInt(year);

  // Calculate the starting index of the items for the given page
  const skip = (pageNum - 1) * limitNum;

  const client = await connectToDatabase();
  const db = client.db();
  const collection = db.collection("crimes");

  const data = await collection.findOne({ month: typeString, year: yearInt });

  const crimes = data.crimes.slice(skip, skip + limitNum);
  const totalItems = data.crimes.length;
  const totalPages = Math.ceil(totalItems / limitNum);

  res
    .status(200)
    .json({ crimes, totalItems, totalPages, currentPage: pageNum });
};
