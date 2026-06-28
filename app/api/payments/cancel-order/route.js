// app/api/payments/cancel-order/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import redis from '@/lib/redis';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('❌ Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, date, hour } = await req.json();

    // Validate required fields
    if (!slotid || !date || (hour === undefined || hour === null)) {
      console.error('❌ Missing required fields:', { slotid, date, hour });
      return NextResponse.json(
        { error: 'Missing required fields: slotid, date, hour' },
        { status: 400 }
      );
    }

    const dateString = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
    }

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: 'Invalid hour (must be 0–23)' }, { status: 400 });
    }

    console.log('🗑️ API: Cancelling order:', { slotid, date: dateString, hour, email: session.user.email });

    // Resolve slotid → UUID
    const slotRes = await query('SELECT id FROM parking_slots WHERE slotid = $1', [slotid]);
    if (slotRes.rowCount === 0) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    const slotUuid = slotRes.rows[0].id;

    // 1. Release Redis lock
    if (redis) {
      try {
        const lockKey = `lock:${slotUuid}:${dateString}:${hour}`;
        await redis.del(lockKey);
        console.log(`[Redis Lock Release] Released lock: ${lockKey}`);
      } catch (redisErr) {
        console.error('Redis lock release failed:', redisErr);
      }
    }

    // 2. Release PostgreSQL lock (database fallback check)
    await query(
      'DELETE FROM temporary_locks WHERE slot_id = $1 AND booking_date = $2::date AND booking_hour = $3',
      [slotUuid, dateString, hour]
    );

    console.log('✅ API: Order cancelled and lock released');

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API: Cancel order error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order', details: error.message },
      { status: 500 }
    );
  }
}