// src/routes/uploadRoutes.js
import express from "express";
import { uploadDataset, getPreview, saveConfig, getFinalPreview } from "../controllers/uploadController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/uploadLimiter.js";
import optionalAuth from "../middleware/optionalAuth.js";


const router = express.Router();

// Upload dataset
router.post("/upload", authenticate, uploadLimiter.single("file"), uploadDataset);

// Preview
router.get("/preview/:id", optionalAuth, getPreview);

// Save visualization config
router.post("/configure", authenticate, saveConfig);

// Final subset preview 
router.get("/final-preview/:id", authenticate, getFinalPreview);

export default router;
