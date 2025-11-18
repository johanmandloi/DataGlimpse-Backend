// src/routes/visualizationRoutes.js
import express from "express";
import { createVisualization, getVisualization, updateVisualization,} from "../controllers/visualizationController.js";
import { authenticate as ensureAuth, optionalAuth,} from "../middleware/authMiddleware.js";

const router = express.Router();

// Create visualization → guest or logged-in both allowed
router.post("/create", optionalAuth, createVisualization);

// Fetch visualization → open for all
router.get("/fetch/:vizId", optionalAuth, getVisualization);

// Update visualization → only logged-in (JWT verified)
router.patch("/update/:vizId", ensureAuth, updateVisualization);

export default router;
