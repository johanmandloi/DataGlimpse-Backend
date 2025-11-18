// src/models/AIMessage.js
import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    vizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visualization",
      required: true,
    },
    type: {
      type: String,
      enum: ["summary", "stats", "recommendation"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AIMessage", aiMessageSchema);
