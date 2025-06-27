import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const parkingSlotSchema = new Schema({
  slotid: { type: String, required: true },
  createdat: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  alloted: { type: Boolean, required: true, default: false },
  location: { type: String, required: true },
  paymentid: { type: String },
  lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot' },
  isApproved: { type: Boolean, default: false },
  bookedHours: [
    {
      hour: { type: Number, required: true }, // e.g., 7 for 7:00–8:00
      email: { type: String, required: true }, // User who booked this hour
      date: { type: Date, required: true }, // Date of booking
    },
  ],
});

export default mongoose.models.ParkingSlot || model('ParkingSlot', parkingSlotSchema, 'ParkingSlot');