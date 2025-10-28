// app/api/lots/route.js
import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ratelimit } from "@/lib/ratelimiter";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    //  Use email if id not guaranteed
    const allowed = await ratelimit({
      key: `user:${session.user.email}`,
      limit: 3,                 // 3 lots per hour
      window_in_seconds: 3600,  // 1 hour
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many lot creation attempts. Try again later." },
        { status: 429 }
      );
    }

    await dbConnect(); // connect now for DB work
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

    return NextResponse.json(newLot, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const lots = await ParkingLot.find({ ownerId: user._id }).lean();
    return NextResponse.json(lots, { status: 200 });
  } catch (err) {
    console.error('Error fetching lots:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
