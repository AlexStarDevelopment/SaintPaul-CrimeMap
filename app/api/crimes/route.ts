import { connectToDatabase } from '../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'june';
  const year = searchParams.get('year') || '2024';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20000';

  // Convert page and limit to integers
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const typeString = type.toString();
  const yearInt = parseInt(year);

  // Basic validation
  if (isNaN(pageNum) || pageNum < 1) {
    return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
  }
  if (isNaN(limitNum) || limitNum < 1) {
    return NextResponse.json({ error: 'Invalid limit number' }, { status: 400 });
  }
  if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2030) {
    // Example year range
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  // Calculate the starting index of the items for the given page
  const skip = (pageNum - 1) * limitNum;

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const collection = db.collection('crimes');

    const data = await collection.findOne({ month: typeString, year: yearInt });

    if (!data || !data.crimes) {
      return NextResponse.json(
        { crimes: [], totalItems: 0, totalPages: 0, currentPage: pageNum },
        { status: 200 }
      );
    }

    const crimes = data.crimes.slice(skip, skip + limitNum);
    const totalItems = data.crimes.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    return NextResponse.json({ crimes, totalItems, totalPages, currentPage: pageNum });
  } catch (error: any) {
    console.error('Error fetching crimes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
