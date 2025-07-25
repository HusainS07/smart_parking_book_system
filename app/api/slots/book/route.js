
import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { triggerBookingWebhook } from '../../webhooks/bookings/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('❌ Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, hour, date, payment_id, location } = await req.json();
    const email = session.user.email;

    console.log('Received booking payload:', { slotid, hour, date, payment_id, email, location, dateType: typeof date, rawDate: JSON.stringify(date) });

    if (!slotid || hour === undefined || !date || !location) {
      console.error('❌ Missing data:', { slotid, hour, date, payment_id, email, location });
      return NextResponse.json({ error: 'Missing slotid, hour, date, or location' }, { status: 400 });
    }

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      console.error('❌ Invalid hour:', hour);
      return NextResponse.json({ error: 'Invalid hour (must be 0–23)' }, { status: 400 });
    }

    const dateString = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.error('❌ Invalid date format:', dateString, 'Type:', typeof date, 'Raw:', JSON.stringify(date));
      return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)', received: dateString }, { status: 400 });
    }

    await dbConnect();

    const slot = await ParkingSlot.findOne({ slotid });
    if (!slot) {
      console.error('❌ Slot not found:', slotid);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const bookedHoursToday = (slot.bookedHours || []).filter(
      (bh) => bh.date && bh.date.toISOString && bh.date.toISOString().split('T')[0] === dateString
    );
    if (bookedHoursToday.some((bh) => bh.hour === hour)) {
      console.error('❌ Hour already booked:', hour, 'on', dateString);
      return NextResponse.json({ error: `Hour ${hour}:00–${hour + 1}:00 already booked on ${dateString}` }, { status: 400 });
    }

    slot.bookedHours.push({ hour, email, date: new Date(dateString), payment_id });
    slot.paymentid = payment_id || slot.paymentid;
    await slot.save();

    // Trigger webhook for real-time updates
    await triggerBookingWebhook({
      slotid,
      hour,
      email,
      date: dateString,
      location,
    });

    console.log(`✅ Slot ${slotid} booked at ${hour}:00–${hour + 1}:00 on ${dateString} by ${email} with payment_id: ${payment_id || 'none'}`);
    return NextResponse.json({ success: true, slot }, { status: 200 });
  } catch (err) {
    console.error('❌ Internal server error:', err.message, err.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
