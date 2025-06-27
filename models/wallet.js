import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
});

export default mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);