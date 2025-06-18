import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();
  try {
    const { lotId } = await req.json();
    await ParkingLot.findByIdAndDelete(lotId);
    return NextResponse.json({ message: 'Lot rejected and deleted' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
