import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    console.log('Session details:', JSON.stringify(session, null, 2));
    if (!session || session.user.role !== 'admin') {
      console.error('Unauthorized access attempt:', session?.user);
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const { lotId } = await req.json();
    await ParkingLot.findByIdAndDelete(lotId);
    console.log('Rejected lot:', lotId);
    return NextResponse.json({ message: 'Lot rejected and deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error rejecting lot:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}