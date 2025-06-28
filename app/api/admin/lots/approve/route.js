import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    console.log('Session details:', JSON.stringify(session, null, 2));
    if (!session || session.user.role !== 'admin') {
      console.error('Unauthorized access attempt:', session?.user);
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const { lotId } = await req.json();
    if (!lotId) {
      console.error('Missing lotId');
      return NextResponse.json({ error: 'Missing lotId' }, { status: 400 });
    }

    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      console.error('Lot not found:', lotId);
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    if (lot.isApproved) {
      console.error('Lot already approved:', lotId);
      return NextResponse.json({ error: 'Lot already approved' }, { status: 400 });
    }

    lot.isApproved = true;
    await lot.save();
    console.log('Approved lot:', lot._id, lot.city);

    const slots = Array.from({ length: lot.totalSpots }).map(() => ({
      slotid: `S_${lot.city.toLowerCase()}_${uuidv4().slice(0, 6)}`,
      createdat: new Date(),
      amount: lot.pricePerHour,
      alloted: false,
      location: lot.city.toLowerCase(),
      isApproved: true,
      paymentid: null,
      lotId: lot._id,
      bookedHours: [],
    }));

    const createdSlots = await ParkingSlot.insertMany(slots);
    console.log('Created slots:', createdSlots.map(s => ({ slotid: s.slotid, location: s.location, isApproved: s.isApproved })));

    return NextResponse.json({ message: 'Lot approved and slots created', slots: createdSlots }, { status: 200 });
  } catch (err) {
    console.error('Slot creation error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

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
      .populate('lotId', 'lotName address')
      .lean();
    const currentHour = parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));

    console.log(`Fetched ${slots.length} slots for location: ${location}`);
    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err);
    return NextResponse.json({ error: 'Failed to load slots', details: err.message }, { status: 500 });
  }
}