// Assuming you are using MongoDB with Mongoose

import dbConnect from "@/lib/dbConnect";
import ParkingSlot from "@/models/parkingslots";

export async function GET(req) {
  const { location } = req.query;

  await dbConnect();

  try {
    const slots = await ParkingSlot.find({
      location: location, // Ensuring case sensitivity issue is handled
      alloted: false,      // Filter for only available (non-alloted) slots
    });

    if (slots.length > 0) {
      return new Response(JSON.stringify(slots), { status: 200 });
    } else {
      return new Response(JSON.stringify([]), { status: 200 });  // No available slots found
    }
  } catch (err) {
    console.error("Error fetching slots:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch slots" }), { status: 500 });
  }
}
