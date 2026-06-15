// app/api/slots/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.toLowerCase();
    if (!location) {
      console.error('Missing location parameter');
      return NextResponse.json({ error: 'Missing location parameter' }, { status: 400 });
    }

    // Fetch approved slots with their lot info via JOIN
    const slotsResult = await query(
      `SELECT
         ps.id, ps.slotid, ps.amount, ps.allotted, ps.location,
         ps.is_approved AS "isApproved", ps.lot_id, ps.created_at AS "createdAt",
         pl.lot_name AS "lotName", pl.address, pl.city
       FROM parking_slots ps
       LEFT JOIN parking_lots pl ON ps.lot_id = pl.id
       WHERE LOWER(ps.location) = $1 AND ps.is_approved = true`,
      [location]
    );

    // Fetch all bookings for these slots
    const slotIds = slotsResult.rows.map(s => s.id);
    let bookingsMap = {};

    if (slotIds.length > 0) {
      const bookingsResult = await query(
        `SELECT slot_id, booking_hour AS hour, email, booking_date AS date, payment_id
         FROM bookings
         WHERE slot_id = ANY($1::uuid[])`,
        [slotIds]
      );
      bookingsResult.rows.forEach(b => {
        if (!bookingsMap[b.slot_id]) bookingsMap[b.slot_id] = [];
        bookingsMap[b.slot_id].push(b);
      });
    }

    // Shape response to match frontend expectations
    const slots = slotsResult.rows.map(s => ({
      _id: s.id,
      slotid: s.slotid,
      amount: parseFloat(s.amount),
      alloted: s.allotted,
      location: s.location,
      isApproved: s.isApproved,
      createdAt: s.createdAt,
      createdat: s.createdAt,
      lotId: s.lot_id ? { _id: s.lot_id, lotName: s.lotName, address: s.address, city: s.city } : null,
      bookedHours: (bookingsMap[s.id] || []).map(b => ({
        hour: b.hour,
        email: b.email,
        date: b.date,
        payment_id: b.payment_id,
      })),
    }));

    const currentHour = parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));

    console.log(`Fetched ${slots.length} slots for location: ${location}`);
    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err.message);
    return NextResponse.json({ error: 'Failed to load slots', details: err.message }, { status: 500 });
  }
}
