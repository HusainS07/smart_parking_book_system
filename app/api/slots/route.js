// app/api/slots/route.js
import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location') || 'mumbai';

  const now = new Date();
  const currentHour = now.getHours();

  // 🔍 Create range for today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // ✅ Filter only slots created today
  const slots = await ParkingSlot.find({
    location,
    isApproved: true,
    createdat: { $gte: today, $lt: tomorrow },
  }).lean();

  return new Response(JSON.stringify({ slots, currentHour }), { status: 200 });
}
