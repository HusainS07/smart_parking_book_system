// models/wallet.js
import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
  username: { type: String }, // display only
  email: { type: String, required: true, unique: true }, // all queries use this
  balance: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export default mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);
