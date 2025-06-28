import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookedHoursSchema = new Schema({
  hour: { type: Number, required: true },
  email: { type: String, required: true },
  date: { type: Date, required: true },
  payment_id: { type: String },
});

const parkingSlotSchema = new Schema({
  slotid: { type: String, required: true, unique: true },
  createdat: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  alloted: { type: Boolean, required: true, default: false },
  location: { type: String, required: true },
  paymentid: { type: String },
  lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot' },
  isApproved: { type: Boolean, default: false },
  bookedHours: [bookedHoursSchema],
});

export default mongoose.models.ParkingSlot || model('ParkingSlot', parkingSlotSchema, 'ParkingSlot');