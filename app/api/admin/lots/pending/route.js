import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug: Log session details
    if (!session || !session.user.isAdmin) {
      console.error('Unauthorized access attempt:', { user: session?.user });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingLots = await ParkingLot.find({ isApproved: false });
    console.log('Pending lots found:', pendingLots); // Debug: Log query result
    return NextResponse.json(pendingLots, { status: 200 });
  } catch (err) {
    console.error('Error fetching pending lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}