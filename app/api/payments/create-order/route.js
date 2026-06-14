// app/api/payments/create-order/route.js
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db'; // PostgreSQL helper

/**
 * POST /api/payments/create-order
 *
 * Expected body: { slotid, amount, date, hour }
 *
 * Flow:
 *  1️⃣ Validate session & payload
 *  2️⃣ Verify slot exists (parking_slots)
 *  3️⃣ Insert a row into temporary_locks with a 5‑minute TTL.
 *     - Unique constraint (slot_id, booking_date, booking_hour) guarantees
 *       only one concurrent checkout per slot/hour.
 *  4️⃣ Create Razorpay order.
 *  5️⃣ Return order details.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('❌ Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, amount, date, hour } = await req.json();
    if (!slotid || !amount || !date || hour === undefined) {
      console.error('❌ Missing fields', { slotid, amount, date, hour });
      return NextResponse.json({ error: 'Missing slotid, amount, date, or hour' }, { status: 400 });
    }

    // Validate date format (YYYY‑MM‑DD) and hour range
    const dateString = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return NextResponse.json({ error: 'Invalid date format (use YYYY‑MM‑DD)' }, { status: 400 });
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: 'Invalid hour (must be 0‑23)' }, { status: 400 });
    }

    // ------------------------------------------------------------
    // 1️⃣ Verify slot exists and fetch its internal UUID
    // ------------------------------------------------------------
    const slotResult = await query(
      'SELECT id FROM parking_slots WHERE slotid = $1',
      [slotid]
    );
    if (slotResult.rowCount === 0) {
      console.error('❌ Slot not found', slotid);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    const slotUuid = slotResult.rows[0].id;

    // ------------------------------------------------------------
    // 2️⃣ Attempt to acquire a temporary lock (5‑minute TTL)
    // ------------------------------------------------------------
    const lockInsert = `
      INSERT INTO temporary_locks (slot_id, booking_date, booking_hour, expires_at)
      VALUES ($1, $2::date, $3, now() + interval '5 minutes')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;
    const lockResult = await query(lockInsert, [slotUuid, dateString, hour]);
    if (lockResult.rowCount === 0) {
      // A lock already exists – another checkout is in progress
      console.warn('⚠️ Booking already being processed for', { slotid, dateString, hour });
      return NextResponse.json({ error: 'This booking is currently being processed' }, { status: 409 });
    }

    // ------------------------------------------------------------
    // 3️⃣ Create Razorpay order
    // ------------------------------------------------------------
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `${slotid}_${hour}_${Date.now().toString().slice(-6)}`,
      payment_capture: 1,
    });

    console.log('✅ Razorpay order created', { orderId: order.id, amount: order.amount });
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency }, { status: 200 });
  } catch (err) {
    console.error('❌ Order creation error', err);
    return NextResponse.json({ error: 'Failed to create order', details: err.message }, { status: 500 });
  }
}
