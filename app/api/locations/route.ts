import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLocations, createLocation } from '@/lib/services/locations';
import { SavedLocation } from '@/types';
import { z } from 'zod';

// Validation schema for creating a location
const createLocationSchema = z.object({
  label: z.string().min(1).max(50),
  address: z.string().min(1).max(200),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius: z.number().min(0.25).max(1),
  notifications: z.object({
    enabled: z.boolean(),
    types: z.array(z.string()),
    severity: z.enum(['all', 'serious', 'violent']),
  }),
  isActive: z.boolean(),
});

// GET /api/locations - Get all saved locations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTier = session.user.subscriptionTier || 'free';
    const locations = await getUserLocations(session.user.id, userTier);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST /api/locations - Create a new saved location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createLocationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Create the location using database service
    const locationData: Omit<SavedLocation, '_id' | 'createdAt' | 'updatedAt'> = {
      userId: session.user.id,
      ...validationResult.data,
    };

    const userTier = session.user.subscriptionTier || 'free';
    const newLocation = await createLocation(locationData, userTier);

    return NextResponse.json({ location: newLocation }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
