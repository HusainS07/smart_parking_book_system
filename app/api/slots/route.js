import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    if (!location) {
      return NextResponse.json({ error: 'Missing location' }, { status: 400 });
    }

    await dbConnect();
    const slots = await ParkingSlot.find({ location: new RegExp(location, 'i') }).lean();
    const sanitizedSlots = slots.map((slot) => ({
      ...slot,
      bookedHours: (slot.bookedHours || []).filter(
        (bh) => bh.date && bh.date.toISOString
      ),
    }));
    return NextResponse.json({ slots: sanitizedSlots, currentHour: new Date().getHours() }, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching slots:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}