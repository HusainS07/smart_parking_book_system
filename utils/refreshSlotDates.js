import dbConnect from '@/lib/dbConnect';
import ParkingSlot from '@/models/parkingslots';

export default async function refreshSlotDates() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await ParkingSlot.find({ isApproved: true }).select('slotid bookedHours alloted');

  const bulkOps = slots.map((slot) => {
    const updatedBookedHours = (slot.bookedHours || []).filter(
      (bh) => bh.date && new Date(bh.date).toISOString().split('T')[0] >= today.toISOString().split('T')[0]
    );

    return {
      updateOne: {
        filter: { _id: slot._id },
        update: {
          $set: {
            bookedHours: updatedBookedHours,
            alloted: false,
            lastRefreshed: today,
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    let attempts = 0;
    const maxRetries = 3;
    while (attempts < maxRetries) {
      try {
        await ParkingSlot.bulkWrite(bulkOps, { ordered: false });
        return;
      } catch (err) {
        attempts++;
        if (attempts === maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}