// src/models/Visualization.js
import mongoose from "mongoose";

const visualizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ✅ make optional for guests
    },
    sessionId: {
      type: String, // ✅ guest sessions
      required: false,
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
    },
    chartType: {
      type: String,
      required: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previewData: {
      type: Array,
      default: [],
    },
    aiMessageIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIMessage",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "final"],
      default: "draft",
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Visualization", visualizationSchema);
