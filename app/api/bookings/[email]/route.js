import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(params.email);
    if (email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden: Email does not match authenticated user' }, { status: 403 });
    }

    await dbConnect();

    const currentDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0]; // YYYY-MM-DD in IST
    console.log('Current Date:', currentDate);

    const slots = await ParkingSlot.find({
      'bookedHours.email': email,
    });

    const bookings = slots
      .flatMap((slot) =>
        (slot.bookedHours || [])
          .filter(
            (bh) =>
              bh.email === email &&
              bh.date &&
              new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0] === currentDate
          )
          .map((bh) => ({
            slotid: slot.slotid,
            location: slot.location,
            amount: slot.amount,
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
          }))
      );

    console.log('Found Bookings:', bookings);
    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}