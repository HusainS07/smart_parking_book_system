import dbConnect from '@/lib/dbConnect';
import ParkingLot from '@/models/ParkingLot';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ratelimit } from "@/lib/ratelimiter";

export async function POST(req) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Rate-limit by user ID
    const allowed = await ratelimit({
      key: `user:${session.user.id}`,
      limit: 3,                 // e.g. 3 lots per hour
      window_in_seconds: 3600,  // 1 hour
    });

    if (!allowed) {
      return NextResponse.json({ error: "Too many lot creation attempts. Try again later." }, { status: 429 });
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

    return NextResponse.json(newLot, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
