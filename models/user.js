import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // ✅ now optional
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  image: { type: String },
  firstName: String,
  lastName: String,
  gender: String,
  phone: String,
  dob: String,
  bloodGroup: String,
  fatherName: String,
  age: String,
  address: String,
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
