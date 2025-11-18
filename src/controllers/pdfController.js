// src/controllers/pdfController.js
// import PDFReport from "../models/PDFReport.js";
// import Visualization from "../models/Visualization.js";
// import AIMessage from "../models/AIMessage.js";

// /**
//  * POST /api/pdf/save
//  * Body must contain exactly ONE of:
//  *  - { vizId }        -> add chart item for that visualization
//  *  - { aiMessageId }  -> add AI message item
//  *
//  * Optional: { title }
//  *
//  * Response:
//  *  { success, message, addedItem, report }
//  */
// export const savePDFDraft = async (req, res) => {
//   try {
//     const { vizId, aiMessageId, title } = req.body;

//     // Use `req.user?.id` (set by authenticate middleware)
//     const userId = req.user?.id || null;

//     // Require exactly one of vizId OR aiMessageId
//     if (!!vizId === !!aiMessageId) {
//       return res.status(400).json({
//         success: false,
//         message: "Provide exactly one of vizId or aiMessageId in the request body.",
//       });
//     }

//     let addedItem = null;

//     // ------------------------------
//     // CASE A: Add chart (vizId)
//     // ------------------------------
//     if (vizId) {
//       // fetch visualization (no AI details)
//       const visualization = await Visualization.findById(vizId).lean();
//       if (!visualization) {
//         return res.status(404).json({ success: false, message: "Visualization not found." });
//       }

//       // Build a clean chart item (only chart-related fields)
//       addedItem = {
//         type: "chart",
//         chartType: visualization.chartType || null,
//         config: visualization.config || {},
//         // Only keep the configured previewData (already present on viz)
//       previewData: visualization.previewData ? JSON.parse(JSON.stringify(visualization.previewData)) : [],
//         datasetName: visualization.datasetId?.fileName || visualization.datasetId || null,
//         createdAt: new Date(),
//       };

//       // Upsert report scoped to userId + vizId (guests: userId null still allowed)
//       let report = await PDFReport.findOne({ vizId, userId, status: "draft" });

//       if (!report) {
//         report = new PDFReport({
//           userId,
//           vizId,
//           title: title || "Untitled Report",
//           items: [addedItem],
//         });
//       } else {
//         // Append chart item
//         report.items.push(addedItem);
//         report.updatedAt = new Date();
//         report.version = (report.version || 1) + 1;
//       }

//       await report.save();

//       return res.status(200).json({
//         success: true,
//         message: "Chart added to PDF draft.",
//         addedItem,
//         report,
//       });
//     }

//     // ------------------------------
//     // CASE B: Add AI message (aiMessageId)
//     // ------------------------------
//     if (aiMessageId) {
//       const aiMsg = await AIMessage.findById(aiMessageId).lean();
//       if (!aiMsg) {
//         return res.status(404).json({ success: false, message: "AI message not found." });
//       }

//       // Build a clean AI item
//       addedItem = {
//         type: "ai",
//         mode: aiMsg.type || "summary",
//         content: aiMsg.content || "",
//         aiMessageId: aiMsg._id,
//         createdAt: aiMsg.createdAt || new Date(),
//       };

//       // Find existing draft for this user (not necessarily tied to vizId)
//       // If the AI message belongs to a visualization, use that vizId; otherwise allow null
//       const targetVizId = aiMsg.vizId || null;

//       let report = await PDFReport.findOne({ vizId: targetVizId, userId, status: "draft" });

//       if (!report) {
//         // create new draft and link it if vizId known
//         report = new PDFReport({
//           userId,
//           vizId: targetVizId,
//           title: title || "Untitled Report",
//           items: [addedItem],
//           linkedAIIds: aiMsg._id ? [aiMsg._id] : [],
//         });
//       } else {
//         // prevent duplicate AI message entries (by aiMessageId)
//         const alreadyLinked = (report.linkedAIIds || []).some((id) => id?.toString() === aiMsg._id.toString());
//         if (!alreadyLinked) {
//           report.linkedAIIds = Array.from(new Set([...(report.linkedAIIds || []), aiMsg._id]));
//           report.items.push(addedItem);
//           report.updatedAt = new Date();
//           report.version = (report.version || 1) + 1;
//         } else {
//           // if already present, just return report with a message
//           return res.status(200).json({
//             success: true,
//             message: "AI message already present in draft (no duplicate added).",
//             addedItem: null,
//             report,
//           });
//         }
//       }

//       await report.save();

//       return res.status(200).json({
//         success: true,
//         message: "AI message added to PDF draft.",
//         addedItem,
//         report,
//       });
//     }

//     // fallback (shouldn't get here)
//     return res.status(400).json({
//       success: false,
//       message: "Invalid request.",
//     });
//   } catch (err) {
//     console.error("❌ Error saving PDF draft:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while saving PDF draft.",
//       error: err.message,
//     });
//   }
// };

// src/controllers/pdfController.js
import PDFReport from "../models/PDFReport.js";
import Visualization from "../models/Visualization.js";
import AIMessage from "../models/AIMessage.js";

/** small helper: convert basic markdown to plain text for PDFs (strip emphasis/asterisks) */
const stripMarkdownToPlain = (md = "") => {
  if (!md) return "";
  // Replace common markdown tokens with plain text equivalents
  return md
    .replace(/\r\n/g, "\n")
    .replace(/(`{1,3})([\s\S]*?)\1/g, "$2") // inline/code blocks -> keep inner
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/\*(.+?)\*/g, "$1") // *italic*
    .replace(/__(.+?)__/g, "$1") // __bold__
    .replace(/_(.+?)_/g, "$1") // _italic_
    .replace(/^\s*[-*+]\s+/gm, "- ") // bullets => dash-space
    .replace(/^\s*\d+\.\s+/gm, "- ")   // numbered -> dash
    .replace(/#+\s*(.*)/g, "$1")      // headings -> text
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links -> text
    .replace(/!\[(.*?)\]\(.*?\)/g, "$1") // images -> alt text
    .replace(/\s{2,}/g, " ")
    .trim();
};

export const savePDFDraft = async (req, res) => {
  try {
    const { vizId, aiMessageId, title, imageData } = req.body;
    const userId = req.user?.id || null;

    // require exactly one of vizId or aiMessageId
    if (!!vizId === !!aiMessageId) {
      return res.status(400).json({
        success: false,
        message: "Provide exactly one of vizId or aiMessageId in the request body.",
      });
    }

    let addedItem = null;

    // CASE: add chart (vizId) — allow optional imageData from client
    if (vizId) {
      const visualization = await Visualization.findById(vizId).lean();
      if (!visualization) {
        return res.status(404).json({ success: false, message: "Visualization not found." });
      }

      addedItem = {
        type: "chart",
        chartType: visualization.chartType || null,
        config: visualization.config || {},
        previewData: Array.isArray(visualization.previewData) ? visualization.previewData : [],
        datasetName: visualization.datasetId?.fileName || visualization.datasetId || null,
        previewImage: imageData || null, // <- saved snapshot if provided
        createdAt: new Date(),
      };

      let report = await PDFReport.findOne({ vizId, userId, status: "draft" });

      if (!report) {
        report = new PDFReport({
          userId,
          vizId,
          title: title || "Untitled Report",
          items: [addedItem],
        });
      } else {
        report.items.push(addedItem);
        report.updatedAt = new Date();
        report.version = (report.version || 1) + 1;
      }

      await report.save();

      return res.status(200).json({
        success: true,
        message: "Chart added to PDF draft.",
        addedItem,
        report,
      });
    }

    // CASE: add AI message — save plain text copy for PDF
    if (aiMessageId) {
      const aiMsg = await AIMessage.findById(aiMessageId).lean();
      if (!aiMsg) {
        return res.status(404).json({ success: false, message: "AI message not found." });
      }

      const plain = stripMarkdownToPlain(aiMsg.content || "");

      addedItem = {
        type: "ai",
        mode: aiMsg.type || "summary",
        content: aiMsg.content || "",
        contentPlain: plain,
        aiMessageId: aiMsg._id,
        createdAt: aiMsg.createdAt || new Date(),
      };

      const targetVizId = aiMsg.vizId || null;
      let report = await PDFReport.findOne({ vizId: targetVizId, userId, status: "draft" });

      if (!report) {
        report = new PDFReport({
          userId,
          vizId: targetVizId,
          title: title || "Untitled Report",
          items: [addedItem],
          linkedAIIds: aiMsg._id ? [aiMsg._id] : [],
        });
      } else {
        const alreadyLinked = (report.linkedAIIds || []).some((id) => id?.toString() === aiMsg._id.toString());
        if (!alreadyLinked) {
          report.linkedAIIds = Array.from(new Set([...(report.linkedAIIds || []), aiMsg._id]));
          report.items.push(addedItem);
          report.updatedAt = new Date();
          report.version = (report.version || 1) + 1;
        } else {
          return res.status(200).json({
            success: true,
            message: "AI message already present in draft (no duplicate added).",
            addedItem: null,
            report,
          });
        }
      }

      await report.save();

      return res.status(200).json({
        success: true,
        message: "AI message added to PDF draft.",
        addedItem,
        report,
      });
    }

    // fallback
    return res.status(400).json({ success: false, message: "Invalid request." });
  } catch (err) {
    console.error("❌ Error saving PDF draft:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while saving PDF draft.",
      error: err.message,
    });
  }
};


/**
 * GET /api/pdf/:vizId
 * Returns drafts for a vizId scoped to authenticated user.
 * If user not authenticated (userId null), returns drafts for vizId (guest).
 */
export const getPDFDrafts = async (req, res) => {
  try {
    const { vizId } = req.params;
    const userId = req.user?.id || null;

    if (!vizId) {
      return res.status(400).json({ success: false, message: "vizId is required." });
    }

    // find drafts for this vizId and user (if userId is null, ignore user filter)
    const query = userId ? { vizId, userId } : { vizId };
    const drafts = await PDFReport.find(query).sort({ updatedAt: -1 }).lean();

    // Return drafts as-is (items include both chart & ai items).
    return res.status(200).json({
      success: true,
      message: "PDF drafts fetched successfully.",
      drafts,
    });
  } catch (err) {
    console.error("❌ Error fetching drafts:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching PDF drafts.",
      error: err.message,
    });
  }
};

/**
 * PATCH /api/pdf/update/:id
 * Updates the items array or title of a PDF draft.
 * Example body: { items: [...], title: "New Title" }
 */
export const updatePDFDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, title } = req.body;
    const userId = req.user?.id || null;

    const report = await PDFReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "PDF draft not found" });
    }

    // ensure only owner can modify
    if (report.userId && userId && report.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this draft" });
    }

    if (Array.isArray(items)) report.items = items;
    if (title) report.title = title;

    report.updatedAt = new Date();
    report.version = (report.version || 1) + 1;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "PDF draft updated successfully",
      report,
    });
  } catch (err) {
    console.error("❌ Error updating PDF draft:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating PDF draft",
      error: err.message,
    });
  }
};


/**
 * DELETE /api/pdf/:id
 * Deletes a draft by id (user must be owner if authenticated).
 */
export const deletePDFDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const report = await PDFReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "PDF draft not found." });
    }

    // If report has an owner and request user is set, ensure ownership
    if (report.userId && userId && report.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this draft." });
    }

    await PDFReport.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "PDF draft deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Error deleting PDF draft:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting PDF draft.",
      error: err.message,
    });
  }
};