import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import redis from '@/lib/redis';

export async function GET(req, { params }) {
  try {
    const { id } = await params; // This can be slot UUID or slotid (like A1)
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!id || !date) {
      return NextResponse.json({ error: 'Missing slot ID or date parameter' }, { status: 400 });
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format (must be YYYY-MM-DD)' }, { status: 400 });
    }

    // 1. Resolve UUID of the slot if human-readable slotid was passed
    let slotUuid = id;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    
    if (!isUuid) {
      const slotRes = await query('SELECT id FROM parking_slots WHERE slotid = $1', [id]);
      if (slotRes.rowCount === 0) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }
      slotUuid = slotRes.rows[0].id;
    }

    const cacheKey = `booked:${slotUuid}:${date}`;
    let bookedHours = [];

    // 2. Try fetching availability set from Redis
    if (redis) {
      try {
        const cached = await redis.smembers(cacheKey);
        const exists = await redis.exists(cacheKey);
        if (exists) {
          // Map to integers (Redis sets return strings)
          bookedHours = (cached || []).map(h => parseInt(h, 10));
          console.log(`[Redis Hit] Booked hours for slot ${id} on ${date}:`, bookedHours);
          return NextResponse.json({ bookedHours }, { status: 200 });
        }
      } catch (redisErr) {
        console.error('Redis read error for slot availability:', redisErr);
      }
    }

    // 3. Fallback: Query PostgreSQL database
    console.log(`[Redis Miss] Querying PostgreSQL bookings for slot ${id} on ${date}`);
    const bookingsResult = await query(
      'SELECT booking_hour AS hour FROM bookings WHERE slot_id = $1 AND booking_date = $2::date',
      [slotUuid, date]
    );
    
    bookedHours = bookingsResult.rows.map(r => r.hour);

    // 4. Cache availability in Redis
    if (redis && bookedHours.length > 0) {
      try {
        // Add elements to Set
        await redis.sadd(cacheKey, ...bookedHours);
        // Expire in 24 hours to automatically purge historical dates
        await redis.expire(cacheKey, 86400);
        console.log(`[Redis Write] Cached booked hours for slot ${id} on ${date}`);
      } catch (redisErr) {
        console.error('Redis write error for slot availability:', redisErr);
      }
    } else if (redis) {
      // If there are no bookings, we can store an empty placeholder or just let it query/miss.
      // To prevent caching empty misses, we can write an empty state or let it hit DB.
      // Writing a sentinel or setting key with no members is not directly supported in Redis, 
      // but we can set a dummy expired key or simply query DB. A query returning 0 rows is cheap.
    }

    return NextResponse.json({ bookedHours }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slot availability:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
