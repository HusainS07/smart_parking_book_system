import mongoose from "mongoose";

const helpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  query: { type: String, required: true },
});

export default mongoose.models.Help || mongoose.model("Help", helpSchema);
