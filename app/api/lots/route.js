// app/api/lots/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ratelimit } from "@/lib/ratelimiter";
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await ratelimit({
      key: `user:${session.user.email}`,
      limit: 3,
      window_in_seconds: 3600,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many lot creation attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { lotName, address, city, totalSpots, pricePerHour } = body;

    if (!lotName || !address || !city || !totalSpots || !pricePerHour) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find user by email
    const userRes = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
    if (userRes.rowCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const ownerId = userRes.rows[0].id;

    const result = await query(
      `INSERT INTO parking_lots (owner_id, lot_name, address, city, total_spots, price_per_hour, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [ownerId, lotName, address, city, totalSpots, pricePerHour]
    );

    const lot = result.rows[0];
    // Shape response to match frontend expectations
    const shaped = {
      _id: lot.id,
      ownerId: lot.owner_id,
      lotName: lot.lot_name,
      address: lot.address,
      city: lot.city,
      totalSpots: lot.total_spots,
      pricePerHour: parseFloat(lot.price_per_hour),
      isApproved: lot.is_approved,
      createdAt: lot.created_at,
    };

    return NextResponse.json(shaped, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRes = await query('SELECT id FROM users WHERE email = $1', [session.user.email]);
    if (userRes.rowCount === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const ownerId = userRes.rows[0].id;

    const result = await query('SELECT * FROM parking_lots WHERE owner_id = $1', [ownerId]);
    const lots = result.rows.map(lot => ({
      _id: lot.id,
      ownerId: lot.owner_id,
      lotName: lot.lot_name,
      address: lot.address,
      city: lot.city,
      totalSpots: lot.total_spots,
      pricePerHour: parseFloat(lot.price_per_hour),
      isApproved: lot.is_approved,
      createdAt: lot.created_at,
    }));

    return NextResponse.json(lots, { status: 200 });
  } catch (err) {
    console.error('Error fetching lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
