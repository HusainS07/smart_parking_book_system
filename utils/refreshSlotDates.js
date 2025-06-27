import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';

export default async function refreshSlotDates() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await ParkingSlot.find({ isApproved: true });

  for (const slot of slots) {
    slot.bookedHours = [];
    slot.alloted = false;
    await slot.save();
  }

  console.log(`✅ Refreshed ${slots.length} slots: cleared bookedHours and reset alloted.`);
}