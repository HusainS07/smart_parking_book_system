import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const email = decodeURIComponent(params.email);
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    await dbConnect();

    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = new Date().getHours(); // 0–23 (e.g., 20 at 8:34 PM IST)

    const slots = await ParkingSlot.find({
      'bookedHours.email': email,
    });

    const bookings = slots
      .flatMap((slot) =>
        (slot.bookedHours || [])
          .filter(
            (bh) =>
              bh.email === email &&
              bh.date.toISOString().split('T')[0] === currentDate &&
              bh.hour >= currentHour
          )
          .map((bh) => ({
            slotid: slot.slotid,
            location: slot.location,
            amount: slot.amount,
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
          }))
      );

    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}