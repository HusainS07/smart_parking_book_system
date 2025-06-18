import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const parkingLotSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lotName: { type: String, required: true },
  address: { type: String, required: true },   // moved out of location
  city: { type: String, required: true },      // moved out of location
  lat: Number,
  lng: Number,
  totalSpots: { type: Number, required: true },
  pricePerHour: { type: Number, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ParkingLot || model('ParkingLot', parkingLotSchema, 'ParkingLot');
