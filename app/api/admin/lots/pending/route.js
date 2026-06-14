// app/api/admin/lots/pending/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const result = await query('SELECT * FROM parking_lots WHERE is_approved = false');
    const pendingLots = result.rows.map(lot => ({
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

    return NextResponse.json(pendingLots, { status: 200 });
  } catch (err) {
    console.error('Error fetching pending lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}