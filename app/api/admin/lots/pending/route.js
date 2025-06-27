import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingLots = await ParkingLot.find({ isApproved: false }).lean();
    return NextResponse.json(pendingLots, { status: 200 });
  } catch (err) {
    console.error('Error fetching pending lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}