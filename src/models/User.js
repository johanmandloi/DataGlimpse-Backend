// src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student_researcher", "analyst_professional", "educator_business"],
    default: "student_researcher",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Prevent model overwrite errors in watch mode
export default mongoose.models.User || mongoose.model("User", UserSchema);
