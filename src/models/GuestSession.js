import mongoose from "mongoose";

const guestSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  datasets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dataset" }],
  visualizationsUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Auto-delete after 6 hours
guestSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 * 6 });

export default mongoose.model("GuestSession", guestSessionSchema);
