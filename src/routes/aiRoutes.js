// src/routes/aiRoutes.js

import express from "express";
import { generateAIInsight, getAIHistory } from "../controllers/aiController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", authenticate, generateAIInsight);
router.get("/history/:vizId", authenticate, getAIHistory);

export default router;

