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
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lotId } = await req.json();

    const lot = await ParkingLot.findById(lotId);
    if (!lot) return NextResponse.json({ error: 'Lot not found' }, { status: 404 });

    if (lot.isApproved) {
      return NextResponse.json({ error: 'Lot already approved' }, { status: 400 });
    }

    lot.isApproved = true;
    await lot.save();
    console.log('Approved lot:', lot); // Debug: Log approved lot

    const slots = Array.from({ length: lot.totalSpots }).map(() => ({
      slotid: `S_${lot.city.toLowerCase()}_${uuidv4().slice(0, 6)}`,
      createdat: new Date(),
      amount: lot.pricePerHour,
      alloted: false,
      location: lot.city,
      isApproved: true,
      paymentid: null,
      lotId: lot._id,
      bookedHours: [],
    }));

    const createdSlots = await ParkingSlot.insertMany(slots);
    console.log('Created slots:', createdSlots); // Debug: Log created slots

    return NextResponse.json({ message: 'Lot approved and slots created', slots: createdSlots }, { status: 200 });
  } catch (err) {
    console.error('Slot creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}