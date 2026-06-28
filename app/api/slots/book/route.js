// app/api/slots/book/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { triggerBookingWebhook } from "../../webhooks/bookings/route";
import redis from "@/lib/redis";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("❌ Unauthorized: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotid, hour, date, payment_id, location } = await req.json();
    const email = session.user.email;

    console.log("Received booking payload:", {
      slotid, hour, date, payment_id, email, location,
    });

    if (!slotid || hour === undefined || !date || !location) {
      console.error("❌ Missing data:", { slotid, hour, date, payment_id, email, location });
      return NextResponse.json(
        { error: "Missing slotid, hour, date, or location" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      console.error("❌ Invalid hour:", hour);
      return NextResponse.json(
        { error: "Invalid hour (must be 0–23)" },
        { status: 400 }
      );
    }

    const dateString = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.error("❌ Invalid date format:", dateString);
      return NextResponse.json(
        { error: "Invalid date format (use YYYY-MM-DD)", received: dateString },
        { status: 400 }
      );
    }

    // 1. Resolve slotid → UUID
    const slotRes = await query('SELECT id FROM parking_slots WHERE slotid = $1', [slotid]);
    if (slotRes.rowCount === 0) {
      console.error("❌ Slot not found:", slotid);
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    const slotUuid = slotRes.rows[0].id;

    // 2. Check if already booked (unique index will also catch this)
    const existingBooking = await query(
      'SELECT id FROM bookings WHERE slot_id = $1 AND booking_date = $2::date AND booking_hour = $3',
      [slotUuid, dateString, hour]
    );
    if (existingBooking.rowCount > 0) {
      console.error("❌ Hour already booked:", hour, "on", dateString);
      return NextResponse.json(
        { error: `Hour ${hour}:00–${hour + 1}:00 already booked on ${dateString}` },
        { status: 400 }
      );
    }

    // 3. Insert confirmed booking
    await query(
      `INSERT INTO bookings (slot_id, booking_hour, email, booking_date, payment_id)
       VALUES ($1, $2, $3, $4::date, $5)`,
      [slotUuid, hour, email, dateString, payment_id || null]
    );

    // 4. Update Redis booking state and release checkout lock
    if (redis) {
      try {
        const bookedKey = `booked:${slotUuid}:${dateString}`;
        const lockKey = `lock:${slotUuid}:${dateString}:${hour}`;
        
        await redis.sadd(bookedKey, hour);
        await redis.expire(bookedKey, 86400); // 24 hours TTL
        await redis.del(lockKey);
        console.log(`[Redis Confirm] Saved booking to set ${bookedKey} and released lock ${lockKey}`);
      } catch (redisErr) {
        console.error('Redis confirmed state update failed:', redisErr);
      }
    }

    // 5. Delete PostgreSQL fallback lock
    await query(
      'DELETE FROM temporary_locks WHERE slot_id = $1 AND booking_date = $2::date AND booking_hour = $3',
      [slotUuid, dateString, hour]
    );

    // 6. Trigger webhook for real-time updates
    await triggerBookingWebhook({
      slotid, hour, email, date: dateString, location,
    });

    console.log(
      `✅ Slot ${slotid} booked at ${hour}:00–${hour + 1}:00 on ${dateString} by ${email} with payment_id: ${payment_id || "none"}`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Internal server error:", err.message, err.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
