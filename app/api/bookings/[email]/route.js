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

    // Get current date and hour in IST
    const now = new Date();
    const currentDate = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0]; // YYYY-MM-DD
    const currentHour = parseInt(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
    console.log('Current Date (IST):', currentDate, 'Current Hour (IST):', currentHour);

    const slots = await ParkingSlot.find({
      'bookedHours.email': email,
    });

    console.log('Raw Slots:', JSON.stringify(slots, null, 2));

    const bookings = slots
      .flatMap((slot) =>
        (slot.bookedHours || [])
          .filter((bh) => {
            if (!bh.email || !bh.date || !bh.date.toISOString) {
              console.log('Invalid bookedHours entry:', bh);
              return false;
            }
            const bookedDate = new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
            const isFutureOrToday = bookedDate > currentDate || (bookedDate === currentDate && bh.hour >= currentHour);
            console.log('Booking Check:', {
              email: bh.email,
              bookedDate,
              hour: bh.hour,
              isFutureOrToday,
            });
            return bh.email === email && isFutureOrToday;
          })
          .map((bh) => ({
            slotid: slot.slotid,
            location: slot.location,
            amount: slot.amount,
            date: new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0],
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
          }))
      );

    console.log('Filtered Bookings:', JSON.stringify(bookings, null, 2));
    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}