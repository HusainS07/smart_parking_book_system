import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(params.email).toLowerCase(); // Normalize email to lowercase
    if (email !== session.user.email.toLowerCase()) {
      console.log('Email mismatch:', { requestEmail: email, sessionEmail: session.user.email });
      return NextResponse.json({ error: 'Forbidden: Email does not match authenticated user' }, { status: 403 });
    }

    console.log('Fetching bookings for user:', { email, sessionUser: session.user });

    await dbConnect();

    // Get current date and hour in IST
    const now = new Date();
    const currentDate = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0]; // YYYY-MM-DD
    const currentHour = parseInt(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
    console.log('Current IST:', { date: currentDate, hour: currentHour });

    const slots = await ParkingSlot.find({
      'bookedHours.email': { $regex: `^${email}$`, $options: 'i' }, // Case-insensitive email match
    }).lean();

    console.log('Raw Slots Found:', slots.length, JSON.stringify(slots, null, 2));

    const bookings = slots
      .flatMap((slot) => {
        if (!slot.bookedHours || !Array.isArray(slot.bookedHours)) {
          console.log('No bookedHours in slot:', slot.slotid);
          return [];
        }

        return slot.bookedHours
          .filter((bh) => {
            // Validate bookedHours entry
            if (!bh.email || !bh.date || isNaN(bh.hour)) {
              console.log('Invalid bookedHours entry in slot', slot.slotid, ':', bh);
              return false;
            }

            // Convert booked date to IST
            const bookedDate = new Date(bh.date);
            if (isNaN(bookedDate.getTime())) {
              console.log('Invalid date in bookedHours:', bh);
              return false;
            }
            const bookedDateIST = bookedDate.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
            const bookedHour = parseInt(bh.hour);

            // Check if booking is today or in the future
            const isFutureOrToday =
              bookedDateIST > currentDate ||
              (bookedDateIST === currentDate && bookedHour >= currentHour);

            console.log('Booking Check:', {
              slotid: slot.slotid,
              email: bh.email,
              bookedDateIST,
              bookedHour,
              isFutureOrToday,
            });

            return bh.email.toLowerCase() === email && isFutureOrToday;
          })
          .map((bh) => ({
            slotid: slot.slotid,
            location: slot.location,
            amount: slot.amount,
            date: new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0],
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
          }));
      });

    console.log('Filtered Bookings:', bookings.length, JSON.stringify(bookings, null, 2));

    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}