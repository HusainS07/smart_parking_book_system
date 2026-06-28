// app/api/slots/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import redis from '@/lib/redis';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.toLowerCase();
    if (!location) {
      console.error('Missing location parameter');
      return NextResponse.json({ error: 'Missing location parameter' }, { status: 400 });
    }

    const cacheKey = `slots:static:${location}`;
    let slotsData = null;

    // 1. Try to get static slots layout from Redis
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          slotsData = typeof cached === 'string' ? JSON.parse(cached) : cached;
          console.log(`[Redis Hit] Retrieved static slots for location: ${location}`);
        }
      } catch (redisErr) {
        console.error('Redis read error for slots layout:', redisErr);
      }
    }

    // 2. Fetch from DB if not cached (or if Redis is offline)
    if (!slotsData) {
      console.log(`[Redis Miss] Fetching static slots from database for location: ${location}`);
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
      slotsData = slotsResult.rows;

      // Cache layout in Redis for 24 hours
      if (redis && slotsData.length > 0) {
        try {
          await redis.set(cacheKey, JSON.stringify(slotsData), { ex: 86400 });
          console.log(`[Redis Write] Cached slots layout for location: ${location}`);
        } catch (redisErr) {
          console.error('Redis write error for slots layout:', redisErr);
        }
      }
    }

    // Shape response matching frontend expectations but returning empty bookedHours for landing page
    const slots = slotsData.map(s => ({
      _id: s.id,
      slotid: s.slotid,
      amount: parseFloat(s.amount),
      alloted: s.allotted,
      location: s.location,
      isApproved: s.isApproved,
      createdAt: s.createdAt,
      createdat: s.createdAt,
      lotId: s.lot_id ? { _id: s.lot_id, lotName: s.lotName, address: s.address, city: s.city } : null,
      bookedHours: [], // Availability is now fetched per-slot on detail page
    }));

    const currentHour = parseInt(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));

    console.log(`Fetched ${slots.length} static slots for location: ${location}`);
    return NextResponse.json({ slots, currentHour }, { status: 200 });
  } catch (err) {
    console.error('Error fetching slots:', err.message);
    return NextResponse.json({ error: 'Failed to load slots', details: err.message }, { status: 500 });
  }
}
