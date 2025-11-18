// ✅ src/routes/pdfRoutes.js
import express from "express";
import { savePDFDraft, getPDFDrafts, deletePDFDraft, updatePDFDraft} from "../controllers/pdfController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/save", authenticate, savePDFDraft);
router.get("/:vizId", authenticate, getPDFDrafts);
router.patch("/update/:id", authenticate, updatePDFDraft);
router.delete("/:id", authenticate, deletePDFDraft);

export default router;