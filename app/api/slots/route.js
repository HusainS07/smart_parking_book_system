import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import ParkingLot from '@/models/ParkingLot';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.toLowerCase() || 'mumbai';

    const slots = await ParkingSlot.find({
      location,
      isApproved: true,
    })
      .populate('lotId', 'lotName address city')
      .lean();

    console.log(`Fetched ${slots.length} slots for location: ${location}`, JSON.stringify(slots, null, 2));

    // Calculate IST time (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
    const istTime = new Date(now.getTime() + istOffset);
    const currentHour = istTime.getHours();
    console.log('Server IST currentHour:', currentHour);

    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}