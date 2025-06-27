import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.toLowerCase() || 'mumbai';

    const slots = await ParkingSlot.find({
      location,
      isApproved: true,
    }).lean();

    console.log('Fetched slots:', JSON.stringify(slots, null, 2)); // Debug

    const currentHour = new Date().getHours();
    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}