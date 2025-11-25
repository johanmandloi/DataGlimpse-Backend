// src/routes/uploadRoutes.js
import express from "express";
import { uploadDataset, getPreview, saveConfig, getFinalPreview } from "../controllers/uploadController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/uploadLimiter.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router();

/**
 * @openapi
 * /v1/upload/upload:
 *   post:
 *     tags:
 *       - upload
 *     summary: Upload dataset (multipart/form-data)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               metadata:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Dataset queued for validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 */
router.post("/upload", authenticate, uploadLimiter.single("file"), uploadDataset);

/**
 * @openapi
 * /v1/upload/preview/{id}:
 *   get:
 *     tags:
 *       - upload
 *     summary: Get dataset preview
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Preview info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatasetPreview'
 */
router.get("/preview/:id", optionalAuth, getPreview);

/**
 * @openapi
 * /v1/upload/configure:
 *   post:
 *     tags:
 *       - upload
 *     summary: Save visualization config related to an uploaded dataset
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadConfig'
 *     responses:
 *       '200':
 *         description: Config saved
 */
router.post("/configure", authenticate, saveConfig);

/**
 * @openapi
 * /v1/upload/final-preview/{id}:
 *   get:
 *     tags:
 *       - upload
 *     summary: Final subset preview (after config)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Final preview
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinalPreview'
 */
router.get("/final-preview/:id", authenticate, getFinalPreview);

export default router;
