import mongoose from "mongoose";
import ParkingSlot from "@/models/parkingslots";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, slotid, hour } = body;

    // ✅ Step 1: Validate input
    if (!email || !slotid || hour === undefined) {
      console.error("❌ Missing data:", { email, slotid, hour });
      return new Response(JSON.stringify({ error: "Missing email, slotid or hour" }), {
        status: 400,
      });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // ✅ Step 2: Find slot
    const slot = await ParkingSlot.findOne({ slotid });

    if (!slot) {
      console.error("❌ Slot not found:", slotid);
      return new Response(JSON.stringify({ error: "Slot not found" }), {
        status: 404,
      });
    }

    // ✅ Step 3: Make sure bookedHours exists
    if (!Array.isArray(slot.bookedHours)) {
      slot.bookedHours = [];
    }

    // ✅ Step 4: Check if the selected hour is already booked
    if (slot.bookedHours.includes(hour)) {
      console.error("❌ Hour already booked:", hour);
      return new Response(JSON.stringify({ error: "Hour already booked" }), {
        status: 400,
      });
    }

    // ✅ Step 5: Book the hour and update slot
    slot.bookedHours.push(hour);
    slot.email = email; // optional: save last booked user
    await slot.save();

    console.log(`✅ Slot ${slotid} booked at ${hour}:00 by ${email}`);
    return new Response(JSON.stringify({ success: true, slot }), { status: 200 });

  } catch (err) {
    console.error("❌ Internal server error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
