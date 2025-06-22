import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';

export default async function refreshSlotDates() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await ParkingSlot.find({ isApproved: true });

  for (const slot of slots) {
    slot.createdat = today;
    slot.bookedHours = {}; // Clear old bookings
    slot.alloted = false;  // Reset to available
    await slot.save();
  }

  console.log(`✅ Refreshed slots: ${slots.length} updated with today's date and cleared hours.`);
}
