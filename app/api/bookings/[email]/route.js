// app/api/bookings/[email]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

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
      console.log('Email mismatch:', { emailParam, sessionEmail });
      return NextResponse.json({ error: 'Forbidden: Email mismatch' }, { status: 403 });
    }

    // Query bookings joined with slot info
    const result = await query(
      `SELECT
         b.id AS "bookingId",
         b.booking_hour AS hour,
         b.booking_date AS date,
         b.payment_id AS "paymentId",
         b.email,
         ps.slotid AS "slotId",
         ps.location,
         ps.amount,
         ps.is_approved AS "isApproved"
       FROM bookings b
       JOIN parking_slots ps ON b.slot_id = ps.id
       WHERE LOWER(b.email) = $1
       ORDER BY b.booking_date DESC, b.booking_hour ASC`,
      [emailParam]
    );

    const bookings = result.rows.map(row => ({
      slotId: row.slotId,
      location: row.location,
      amount: parseFloat(row.amount),
      date: new Date(row.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: `${row.hour}:00–${row.hour + 1}:00`,
      hour: row.hour,
      paymentId: row.paymentId,
      bookingId: row.bookingId,
      isApproved: row.isApproved,
    }));

    console.log(`Found ${bookings.length} bookings for ${emailParam}`);
    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}