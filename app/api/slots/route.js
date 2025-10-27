// app/api/slots/route.js
import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import ParkingLot from '@/models/ParkingLot';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.toLowerCase();
    if (!location) {
      console.error('Missing location parameter');
      return NextResponse.json({ error: 'Missing location parameter' }, { status: 400 });
    }

    const slots = await ParkingSlot.find({ location, isApproved: true })
      .populate('lotId', 'lotName address city')
      .lean();
    const currentHour = parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));

    console.log(`Fetched ${slots.length} slots for location: ${location}`, JSON.stringify(slots.map(s => ({ slotid: s.slotid, location: s.location, isApproved: s.isApproved })), null, 2));
    console.log('Server IST currentHour:', currentHour);

    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err.message);
    return NextResponse.json({ error: 'Failed to load slots', details: err.message }, { status: 500 });
  }
}
