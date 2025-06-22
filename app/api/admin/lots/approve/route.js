import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // Import UUID

export async function POST(req) {
  await dbConnect();

  try {
    const { lotId } = await req.json();

    // Find the parking lot by ID
    const lot = await ParkingLot.findById(lotId);
    if (!lot) return NextResponse.json({ error: 'Lot not found' }, { status: 404 });

    // Mark the lot as approved
    lot.isApproved = true;
    await lot.save();

    // Generate unique slots
    const slots = Array.from({ length: lot.totalSpots }).map(() => ({
      slotid: `S_${lot.city.toLowerCase()}_${uuidv4().slice(0, 6)}`, // Unique + readable
      createdat: new Date(),
      amount: lot.pricePerHour,
      alloted: false,
      location: lot.city,
      isApproved: true, // Mark as approved
      paymentid: null,
      lotId: lot._id,
    }));

    // Insert the slots
    await ParkingSlot.insertMany(slots);

    return NextResponse.json({ message: 'Lot approved and slots created' }, { status: 200 });

  } catch (err) {
    console.error('Slot creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
