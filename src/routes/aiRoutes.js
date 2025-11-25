// src/routes/aiRoutes.js
import express from "express";
import { generateAIInsight, getAIHistory } from "../controllers/aiController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /v1/ai/generate:
 *   post:
 *     tags:
 *       - ai
 *     summary: Generate an AI insight for a visualization/dataset
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vizId, prompt]
 *             properties:
 *               vizId:
 *                 type: string
 *               prompt:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Insight generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insightId:
 *                   type: string
 *                 content:
 *                   type: object
 *       '401':
 *         $ref: '#/components/schemas/Error'
 */
router.post("/generate", authenticate, generateAIInsight);

/**
 * @openapi
 * /v1/ai/history/{vizId}:
 *   get:
 *     tags:
 *       - ai
 *     summary: Get AI generation history for a visualization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: vizId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: History list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AIHistoryItem'
 */
router.get("/history/:vizId", authenticate, getAIHistory);

export default router;
