import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getLocationById, updateLocation, deleteLocation } from '@/lib/services/locations';
import { z } from 'zod';

// Validation schema for updating a location
const updateLocationSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  address: z.string().min(1).max(200).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  radius: z.number().min(0.25).max(1).optional(),
  notifications: z
    .object({
      enabled: z.boolean(),
      types: z.array(z.string()),
      severity: z.enum(['all', 'serious', 'violent']),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// GET /api/locations/[id] - Get a specific saved location
export async function GET(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const resolvedParams =
      rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams;
    const id: string | undefined = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const location = await getLocationById(id, session.user.id);

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}

// PUT /api/locations/[id] - Update a saved location
export async function PUT(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const resolvedParams =
      rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams;
    const id: string | undefined = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateLocationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updatedLocation = await updateLocation(id, session.user.id, validationResult.data);

    return NextResponse.json({ location: updatedLocation });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// DELETE /api/locations/[id] - Delete a saved location
export async function DELETE(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params;
    const resolvedParams =
      rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams;
    const id: string | undefined = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteLocation(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
