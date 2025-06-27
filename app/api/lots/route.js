import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lotName, address, city, totalSpots, pricePerHour } = body;

    if (!lotName || !address || !city || !totalSpots || !pricePerHour) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newLot = await ParkingLot.create({
      ownerId: user._id,
      lotName,
      address,
      city,
      totalSpots,
      pricePerHour,
      isApproved: false,
    });

    console.log('Created lot:', newLot); // Debug: Log created lot
    return NextResponse.json(newLot, { status: 201 });
  } catch (err) {
    console.error('Error creating lot:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const lots = await ParkingLot.find({ ownerId: user._id }).lean();
    console.log('Fetched lots for user:', lots); // Debug: Log fetched lots
    return NextResponse.json(lots, { status: 200 });
  } catch (err) {
    console.error('Error fetching lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}