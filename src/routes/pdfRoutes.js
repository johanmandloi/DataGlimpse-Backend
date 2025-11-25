// src/routes/pdfRoutes.js
import express from "express";
import { savePDFDraft, getPDFDrafts, deletePDFDraft, updatePDFDraft } from "../controllers/pdfController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /v1/pdf/save:
 *   post:
 *     tags:
 *       - pdf
 *     summary: Save a PDF draft
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PDFDraft'
 *     responses:
 *       '201':
 *         description: Draft saved
 */
router.post("/save", authenticate, savePDFDraft);

/**
 * @openapi
 * /v1/pdf/{vizId}:
 *   get:
 *     tags:
 *       - pdf
 *     summary: Get PDF drafts for a visualization
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
 *         description: List of drafts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PDFDraft'
 */
router.get("/:vizId", authenticate, getPDFDrafts);

/**
 * @openapi
 * /v1/pdf/update/{id}:
 *   patch:
 *     tags:
 *       - pdf
 *     summary: Update a PDF draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PDFDraft'
 *     responses:
 *       '200':
 *         description: Draft updated
 */
router.patch("/update/:id", authenticate, updatePDFDraft);

/**
 * @openapi
 * /v1/pdf/{id}:
 *   delete:
 *     tags:
 *       - pdf
 *     summary: Delete a PDF draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Deleted
 */
router.delete("/:id", authenticate, deletePDFDraft);

export default router;
