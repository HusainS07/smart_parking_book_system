import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },   
  count: { type: Number, default: 0 },                   
  expireAt: { 
    type: Date, 
    required: true, 
    index: { expires: 0 }                                //  TTL index for auto-deletion
  }
});

// ✅ Reuse existing model if already compiled
export default mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
