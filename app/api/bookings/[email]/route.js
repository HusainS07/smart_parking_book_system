// app/api/bookings/[email]/route.js
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

    // Get and normalize the email
    const emailParam = decodeURIComponent(params.email).toLowerCase().trim();
    const sessionEmail = session.user.email.toLowerCase().trim();

    // Validate email match
    if (emailParam !== sessionEmail) {
      console.log(' Email mismatch:', { emailParam, sessionEmail });
      return NextResponse.json({ error: 'Forbidden: Email mismatch' }, { status: 403 });
    }

    await dbConnect();
    console.log(' Database connected, looking for bookings for:', emailParam);

    // Get all slots first
    const allSlots = await ParkingSlot.find({}).lean();
    console.log(` Found ${allSlots.length} total slots in database`);

    // Process each slot for the target email
    const bookings = [];
    allSlots.forEach(slot => {
      // Log all bookings in this slot
      if (slot.bookedHours && slot.bookedHours.length > 0) {
        console.log(`\n Slot ${slot.slotid} has bookings:`, 
          JSON.stringify(slot.bookedHours.map(b => ({
            email: b.email,
            date: b.date,
            hour: b.hour,
            payment_id: b.payment_id
          })), null, 2)
        );

        // Debug: Log slot details
        console.log('Slot details:', {
          id: slot._id,
          slotid: slot.slotid,
          location: slot.location,
          amount: slot.amount
        });

        // Filter bookings for target email
        const matchingBookings = slot.bookedHours
          .filter(bh => {
            const isMatch = bh.email && bh.email.toLowerCase().trim() === emailParam;
            console.log(`Checking booking:`, {
              storedEmail: bh.email,
              matches: isMatch,
              date: bh.date,
              hour: bh.hour
            });
            return isMatch;
          })
          .map(bh => ({
            slotId: slot.slotid || `S_${slot.location}_${slot._id.toString().substr(-6)}`,
            location: slot.location,
            amount: slot.amount,
            date: new Date(bh.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
            hour: bh.hour,
            paymentId: bh.payment_id,
            bookingId: bh._id,
            isApproved: slot.isApproved
          }));

        if (matchingBookings.length > 0) {
          console.log(` Found ${matchingBookings.length} matching bookings in slot ${slot.slotid}`);
          bookings.push(...matchingBookings);
        }
      }
    });

    // Log final results
    if (bookings.length === 0) {
      console.log(' No bookings found for email:', emailParam);
    } else {
      console.log(' Final results:', {
        totalBookings: bookings.length,
        bookings: bookings.map(b => ({
          slotId: b.slotId,
          location: b.location,
          date: b.date,
          time: b.time,
          paymentId: b.paymentId
        }))
      });
    }

    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error(' Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}