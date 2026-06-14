// app/api/admin/lots/approve/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const { lotId } = await req.json();
    if (!lotId) {
      return NextResponse.json({ error: 'Missing lotId' }, { status: 400 });
    }

    // Fetch the lot
    const lotRes = await query('SELECT * FROM parking_lots WHERE id = $1', [lotId]);
    if (lotRes.rowCount === 0) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }
    const lot = lotRes.rows[0];

    if (lot.is_approved) {
      return NextResponse.json({ error: 'Lot already approved' }, { status: 400 });
    }

    // Ensure city is lowercase
    const city = lot.city.toLowerCase();

    // Update lot to approved
    await query('UPDATE parking_lots SET is_approved = true, city = $1 WHERE id = $2', [city, lotId]);

    // Create parking slots for the lot
    const slotValues = [];
    const slotParams = [];
    let paramIdx = 1;

    for (let i = 0; i < lot.total_spots; i++) {
      const slotid = `S_${city}_${uuidv4().slice(0, 6)}`;
      slotValues.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
      slotParams.push(slotid, lot.price_per_hour, city, lotId, true);
      paramIdx += 5;
    }

    const insertQuery = `
      INSERT INTO parking_slots (slotid, amount, location, lot_id, is_approved)
      VALUES ${slotValues.join(', ')}
      RETURNING *
    `;

    const slotsRes = await query(insertQuery, slotParams);
    const createdSlots = slotsRes.rows.map(s => ({
      _id: s.id,
      slotid: s.slotid,
      amount: parseFloat(s.amount),
      location: s.location,
      isApproved: s.is_approved,
      lotId: s.lot_id,
    }));

    console.log('Approved lot:', lotId, city, `Created ${createdSlots.length} slots`);
    return NextResponse.json({ message: 'Lot approved and slots created', slots: createdSlots }, { status: 200 });
  } catch (err) {
    console.error('Slot creation error:', err.message, err.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}