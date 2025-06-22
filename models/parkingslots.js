import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const parkingSlotSchema = new Schema({
  slotid: { type: String, required: true },
  createdat: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  alloted: { type: Boolean, required: true, default: false },
  location: { type: String, required: true },
  paymentid: { type: String },
  bookedby: { type: String },
  lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot' },
  isApproved: { type: Boolean, default: false },

  //  DATE-WISE BOOKING HOURS
  bookedHours: {
    type: Map,
    of: [Number], // keys = "2024-06-22", value = [9, 10, 11]
    default: {},
  },
});

export default mongoose.models.ParkingSlot || model('ParkingSlot', parkingSlotSchema, 'ParkingSlot');
