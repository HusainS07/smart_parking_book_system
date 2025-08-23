import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ratelimit } from "@/lib/ratelimiter";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Rate-limit per authenticated user
    const allowed = await ratelimit({
      key: `user:${session.user.id}`,
      limit: 10,               // e.g. 10 requests
      window_in_seconds: 60,   // per 1 minute
    });

    if (!allowed) {
      return NextResponse.json({ error: "Too many booking requests. Try again later." }, { status: 429 });
    }

    const email = decodeURIComponent(params.email).toLowerCase();
    if (email !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: Email mismatch' }, { status: 403 });
    }

    await dbConnect();
    // 🔽 your booking fetch logic stays unchanged...
    const now = new Date();
    const currentDate = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
    const currentHour = parseInt(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));

    const slots = await ParkingSlot.find({
      'bookedHours.email': { $regex: `^${email}$`, $options: 'i' },
    }).lean();

    const bookings = slots
      .flatMap((slot) =>
        (slot.bookedHours || [])
          .filter((bh) => {
            if (!bh.email || !bh.date || isNaN(bh.hour)) return false;
            const bookedDateIST = new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0];
            const bookedHour = parseInt(bh.hour);
            return (
              bh.email.toLowerCase() === email &&
              (bookedDateIST > currentDate ||
                (bookedDateIST === currentDate && bookedHour >= currentHour))
            );
          })
          .map((bh) => ({
            slotid: slot.slotid,
            location: slot.location,
            amount: slot.amount,
            date: new Date(bh.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split('T')[0],
            time: `${bh.hour}:00–${bh.hour + 1}:00`,
          }))
      );

    return NextResponse.json(bookings, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
