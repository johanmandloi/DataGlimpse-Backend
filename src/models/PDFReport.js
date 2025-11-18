// ✅ src/models/PDFReport.js
import mongoose from "mongoose";

const pdfReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // allow guests too
    },
    vizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visualization",
      required: true,
    },
    linkedAIIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIMessage",
      },
    ],
    items: {
      type: Array,
      default: [],
    },
    title: {
      type: String,
      default: "Untitled Report",
    },
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

export default mongoose.model("PDFReport", pdfReportSchema);