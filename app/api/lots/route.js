import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/user';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { lotName, address, city, totalSpots, pricePerHour, ownerEmail } = body;

    // Validate required fields
    if (!lotName || !address || !city || !totalSpots || !pricePerHour || !ownerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email: ownerEmail });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Create parking lot (flat structure for address and city)
    const newLot = await ParkingLot.create({
      ownerId: user._id,
      lotName,
      address,
      city,
      totalSpots,
      pricePerHour,
      isApproved: false,
    });

    return NextResponse.json(newLot, { status: 201 });
  } catch (err) {
    console.error('Error creating lot:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await User.findOne({ email }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const lots = await ParkingLot.find({ ownerId: user._id }).lean();
    return NextResponse.json(lots, { status: 200 });
  } catch (err) {
    console.error('Error fetching lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
