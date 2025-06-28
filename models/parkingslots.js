import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookedHoursSchema = new Schema({
  hour: { type: Number, required: true }, // e.g., 7 for 7:00–8:00
  email: { type: String, required: true }, // User who booked this hour
  date: { type: Date, required: true }, // Date of booking
  payment_id: { type: String }, // Razorpay payment ID
});

const parkingSlotSchema = new Schema({
  slotid: { type: String, required: true, unique: true },
  createdat: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  alloted: { type: Boolean, required: true, default: false },
  location: { type: String, required: true },
  paymentid: { type: String }, // Razorpay payment ID for the latest booking
  lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot' },
  isApproved: { type: Boolean, default: false },
  bookedHours: [bookedHoursSchema],
});

export default mongoose.models.ParkingSlot || model('ParkingSlot', parkingSlotSchema, 'ParkingSlot');