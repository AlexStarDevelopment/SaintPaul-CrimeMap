import { connectToDatabase } from '../../../lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'june';
  const year = searchParams.get('year') || '2024';
  const limit = searchParams.get('limit') || '20000';

  // Convert limit to integer
  const limitNum = parseInt(limit);
  const typeString = type.toString();
  const yearInt = parseInt(year);

  // Basic validation
  if (isNaN(limitNum) || limitNum < 1) {
    return NextResponse.json({ error: 'Invalid limit number' }, { status: 400 });
  }
  if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2030) {
    // Example year range
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const collection = db.collection('crimes');

    const data = await collection.findOne({ month: typeString, year: yearInt });

    if (!data || !data.crimes) {
      return NextResponse.json({ totalItems: 0, totalPages: 0 }, { status: 200 });
    }

    const totalItems = data.crimes.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    return NextResponse.json({ totalItems, totalPages });
  } catch (error: any) {
    console.error('Error fetching total crimes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
