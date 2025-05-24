import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const parkingSlotSchema = new Schema({
  slotid: { type: String, required: true },
  createdat: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  alloted: { type: Boolean, required: true, default: false },
  location: { type: String, required: true },
  paymentid: { type: String },
  bookedby : { type: String }
});

export default mongoose.models.ParkingSlot || model('ParkingSlot', parkingSlotSchema, 'ParkingSlot');  // Collection name "parkingslots"
