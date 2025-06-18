// File: app/api/admin/lots/pending/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';

export async function GET(req) {
  await dbConnect();

  try {
    const pendingLots = await ParkingLot.find({ isApproved: false }).lean();
    return NextResponse.json(pendingLots);
  } catch (err) {
    console.error('Error fetching pending lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
