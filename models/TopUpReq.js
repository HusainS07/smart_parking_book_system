// models/TopUpReq.js
import mongoose from "mongoose";

const TopUpReqSchema = new mongoose.Schema(
  {
    walletid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.TopUpReq || mongoose.model("TopUpReq", TopUpReqSchema);
