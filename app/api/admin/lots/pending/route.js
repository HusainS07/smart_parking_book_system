import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    console.log('Session details:', JSON.stringify(session, null, 2));
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      console.error('User is not admin:', session.user);
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const pendingLots = await ParkingLot.find({ isApproved: false });
    console.log('Pending lots:', JSON.stringify(pendingLots, null, 2));
    return NextResponse.json(pendingLots, { status: 200 });
  } catch (err) {
    console.error('Error fetching pending lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}