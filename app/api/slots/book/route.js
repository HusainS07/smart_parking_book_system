import dbConnect from "@/lib/dbConnect";
import ParkingSlot from "@/models/parkingslots";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { slotid, bookedby } = body;

    // 🔍 Validate input
    if (!slotid || !bookedby) {
      return new Response("Missing slotid or bookedby", { status: 400 });
    }

    // 🔍 Find slot by slotid
    const slot = await ParkingSlot.findOne({ slotid });

    if (!slot) {
      return new Response("Parking slot not found", { status: 404 });
    }

    if (slot.alloted) {
      return new Response("Parking slot already booked", { status: 400 });
    }

    // ✅ Book slot
    slot.alloted = true;
    slot.bookedby = bookedby;
    await slot.save();

    return new Response("Parking slot successfully booked", { status: 200 });
  } catch (error) {
    console.error("Booking error:", error);
    return new Response("Error while booking parking slot", { status: 500 });
  }
}
