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
    const slots = await ParkingSlot.find({ location: new RegExp(location, 'i') });
    return NextResponse.json({ slots, currentHour: new Date().getHours() }, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching slots:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}