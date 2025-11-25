// server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import path from "path";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import visualizationRoutes from "./routes/visualizationRoutes.js"; // ✅ NEW
import aiRoutes from "./routes/aiRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import swaggerSpec, { setupSwagger } from "./swagger.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js"; // centralized error handling

// ------------------------------------
// Environment & App Initialization
// ------------------------------------
dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// ------------------------------------
// Middleware
// ------------------------------------
app.use(express.json());

// CORS setup for frontend
app.use(
  cors({
    origin: "http://localhost:5173", // React dev server port
    credentials: true,
  })
);

// Serve uploaded files (optional, useful for debugging)
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// ------------------------------------
// API Routes
// ------------------------------------

// Auth routes (OTP + Signup/Login)
app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);

// Dataset routes (upload, preview, configure, final-preview)
app.use("/api/data", uploadRoutes);

// ✅ Visualization routes (create / fetch / update)
app.use("/api/visualizations", visualizationRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/pdf", pdfRoutes);

setupSwagger(app, "/docs");


// ------------------------------------
// Default Route
// ------------------------------------
app.get("/", (req, res) => {
  res.send("✅ DataGlimpse Backend is running (Auth + Data + Visualizations ready)");
});

// ------------------------------------
// Centralized Error Handler (must be last)
// ------------------------------------
app.use(errorHandler);

// ------------------------------------
// Start Server
// ------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Hello Johan