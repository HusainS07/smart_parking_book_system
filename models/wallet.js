// models/wallet.js

import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
}, {
  timestamps: true,
});

// ✅ Check if model is already compiled, else create
export default mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
