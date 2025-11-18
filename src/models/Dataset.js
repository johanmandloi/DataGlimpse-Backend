// src/models/Dataset.js
import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  sessionId: { type: String, required: false },
  fileName: { type: String, required: true },
  rows: { type: Number, required: true },
  columns: [{ type: String, required: true }],
  columnTypes: { type: Map, of: String },
  samplePreview: [{ type: Object }],
  originalData: [{ type: Object }],
  cleanedData: [{ type: Object }],
  config: { type: Object }, // still used in DataSelection & FinalPreview
  visualizations: [
    {
      vizId: { type: mongoose.Schema.Types.ObjectId, ref: "Visualization" },
      chartType: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  isGuestFile: { type: Boolean, default: false },
});

export default mongoose.model("Dataset", datasetSchema);
