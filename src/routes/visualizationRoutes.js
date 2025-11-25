// src/routes/visualizationRoutes.js
import express from "express";
import { createVisualization, getVisualization, updateVisualization } from "../controllers/visualizationController.js";
import { authenticate as ensureAuth, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /v1/visualization/create:
 *   post:
 *     tags:
 *       - visualization
 *     summary: Create a visualization (guest or logged-in allowed)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisualizationRequest'
 *     responses:
 *       '201':
 *         description: Visualization created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visualization'
 */
router.post("/create", optionalAuth, createVisualization);

/**
 * @openapi
 * /v1/visualization/fetch/{vizId}:
 *   get:
 *     tags:
 *       - visualization
 *     summary: Fetch a visualization (public or protected)
 *     parameters:
 *       - name: vizId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Visualization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visualization'
 */
router.get("/fetch/:vizId", optionalAuth, getVisualization);

/**
 * @openapi
 * /v1/visualization/update/{vizId}:
 *   patch:
 *     tags:
 *       - visualization
 *     summary: Update a visualization (authenticated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: vizId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisualizationRequest'
 *     responses:
 *       '200':
 *         description: Updated visualization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visualization'
 */
router.patch("/update/:vizId", ensureAuth, updateVisualization);

export default router;
