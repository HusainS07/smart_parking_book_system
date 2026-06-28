// app/api/payments/create-order/route.js
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db'; // PostgreSQL helper
import redis from '@/lib/redis';

/**
 * POST /api/payments/create-order
 *
 * Expected body: { slotid, amount, date, hour }
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

    // 1️⃣ Verify slot exists and fetch its internal UUID
    const slotResult = await query(
      'SELECT id FROM parking_slots WHERE slotid = $1',
      [slotid]
    );
    if (slotResult.rowCount === 0) {
      console.error('❌ Slot not found', slotid);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    const slotUuid = slotResult.rows[0].id;

    // 2️⃣ Attempt to acquire lock (Redis first, fallback to DB if Redis offline)
    let lockAcquired = false;

    if (redis) {
      try {
        const bookedKey = `booked:${slotUuid}:${dateString}`;
        const lockKey = `lock:${slotUuid}:${dateString}:${hour}`;

        // Check if already booked
        const isBooked = await redis.sismember(bookedKey, hour);
        if (isBooked) {
          return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
        }

        // Try to acquire 5-minute lock (300 seconds)
        const acquired = await redis.set(lockKey, session.user.email, { nx: true, ex: 300 });
        if (acquired) {
          lockAcquired = true;
          console.log(`[Redis Lock] Lock acquired for slot ${slotid} on ${dateString} at hour ${hour}`);
        } else {
          console.warn('⚠️ Redis Lock: Booking already being processed for', { slotid, dateString, hour });
          return NextResponse.json({ error: 'This booking is currently being processed by another user' }, { status: 409 });
        }
      } catch (redisErr) {
        console.error('Redis lock acquisition failed, falling back to DB lock:', redisErr);
      }
    }

    if (!lockAcquired) {
      // Fallback: database temporary locks table
      const lockInsert = `
        INSERT INTO temporary_locks (slot_id, booking_date, booking_hour, expires_at)
        VALUES ($1, $2::date, $3, now() + interval '5 minutes')
        ON CONFLICT DO NOTHING
        RETURNING id;
      `;
      const lockResult = await query(lockInsert, [slotUuid, dateString, hour]);
      if (lockResult.rowCount === 0) {
        console.warn('⚠️ DB Lock: Booking already being processed for', { slotid, dateString, hour });
        return NextResponse.json({ error: 'This booking is currently being processed' }, { status: 409 });
      }
      console.log(`[DB Lock] Lock acquired in PostgreSQL for slot ${slotid} on ${dateString} at hour ${hour}`);
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
