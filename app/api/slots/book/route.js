import mongoose from "mongoose";
import ParkingSlot from "@/models/parkingslots";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, slotid } = body;

    // ✅ Step 1: Validate input
    if (!email || !slotid) {
      console.error("❌ Missing email or slotid:", { email, slotid });
      return new Response(JSON.stringify({ error: "Missing email or slotid" }), {
        status: 400,
      });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // ✅ Step 2: Check if slot exists
    const slot = await ParkingSlot.findOne({ slotid });

    if (!slot) {
      console.error("❌ Slot not found:", slotid);
      return new Response(JSON.stringify({ error: "Slot not found" }), {
        status: 400,
      });
    }

    // ✅ Step 3: Check if already booked
    if (slot.alloted === true) {
      console.error("❌ Slot already booked:", slotid);
      return new Response(JSON.stringify({ error: "Slot already booked" }), {
        status: 400,
      });
    }

    // ✅ Step 4: Update slot
    slot.alloted = true;
    slot.email = email;
    await slot.save();

    console.log("✅ Slot booked:", slotid);
    return new Response(JSON.stringify({ success: true, slot }), { status: 200 });

  } catch (err) {
    console.error("❌ Internal server error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
