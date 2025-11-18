import Dataset from "../models/Dataset.js";
import Visualization from "../models/Visualization.js";
import mongoose from "mongoose";

// -----------------------------------------------------
// POST /api/visualizations/create
// -----------------------------------------------------
export const createVisualization = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.user?.sessionId || null;
    const { datasetId, chartType, config } = req.body;

    if (!datasetId || !chartType || !config) {
      return res
        .status(400)
        .json({ success: false, message: "datasetId, chartType, and config are required" });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    // -----------------------------
    // 1️⃣ Determine row slice range
    // -----------------------------
    const startRow = config.startRow ? Math.max(1, Number(config.startRow)) : 1;
    const endRow = config.endRow
      ? Math.min(Number(config.endRow), dataset.rows)
      : dataset.rows;

    const startIdx = startRow - 1;
    const endIdx = endRow;

    // -----------------------------
    // 2️⃣ Determine which columns to include
    // -----------------------------
    // Extract string fields from config that match dataset columns
    const selectedKeys = Object.values(config).filter(
      (val) => typeof val === "string" && dataset.columns.includes(val)
    );

    // -----------------------------
    // 3️⃣ Slice and filter data
    // -----------------------------
    const slicedRows = (dataset.cleanedData || []).slice(startIdx, endIdx);

    const previewData = slicedRows.map((row) => {
      const filtered = {};
      selectedKeys.forEach((key) => {
        filtered[key] = row[key];
      });
      return filtered;
    });

    // Optional limit (to prevent large preview payloads)
    const MAX_PREVIEW_ROWS = 1000;
    const limitedPreviewData = previewData.slice(0, MAX_PREVIEW_ROWS);

    // -----------------------------
    // 4️⃣ Create visualization document
    // -----------------------------
    const vizDoc = new Visualization({
      userId,
      sessionId,
      datasetId,
      chartType,
      config,
      previewData: limitedPreviewData,
      status: "draft",
    });

    const savedViz = await vizDoc.save();

    // -----------------------------
    // 5️⃣ Link to dataset (append to visualizations array)
    // -----------------------------
    dataset.visualizations = dataset.visualizations || [];
    dataset.visualizations.push({
      vizId: savedViz._id,
      chartType,
      createdAt: new Date(),
    });

    // Clear dataset config after visualization creation
    dataset.config = {};
    await dataset.save();

    // -----------------------------
    // 6️⃣ Respond
    // -----------------------------
    return res.status(201).json({
      success: true,
      message: "Visualization created and linked to dataset",
      vizId: savedViz._id,
      visualization: savedViz,
    });
  } catch (err) {
    console.error("❌ Error creating visualization:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating visualization",
      error: err.message,
    });
  }
};

// -----------------------------------------------------
// GET /api/visualizations/fetch/:vizId
// -----------------------------------------------------
export const getVisualization = async (req, res, next) => {
  try {
    const { vizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vizId)) {
      return res.status(400).json({ success: false, message: "Invalid visualization ID" });
    }

    const visualization = await Visualization.findById(vizId).populate({
      path: "datasetId",
      select: "fileName columns rows",
    });

    if (!visualization) {
      return res.status(404).json({ success: false, message: "Visualization not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Visualization fetched successfully",
      visualization,
    });

  } catch (err) {
    console.error("❌ Error fetching visualization:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching visualization",
      error: err.message,
    });
  }
};

// -----------------------------------------------------
// PATCH /api/visualizations/update/:vizId
// -----------------------------------------------------
export const updateVisualization = async (req, res, next) => {
  try {
    const { vizId } = req.params;
    const config = req.body.config || req.body; // ✅ Accept both shapes

    if (!mongoose.Types.ObjectId.isValid(vizId)) {
      return res.status(400).json({ success: false, message: "Invalid visualization ID" });
    }

    const visualization = await Visualization.findById(vizId);
    if (!visualization) {
      return res.status(404).json({ success: false, message: "Visualization not found" });
    }

    // Ensure only the owner can update
    if (
      req.user &&
      visualization.userId &&
      visualization.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this visualization",
      });
    }

    if (config) {
      const dataset = await Dataset.findById(visualization.datasetId);
      if (!dataset) {
        return res.status(404).json({ success: false, message: "Linked dataset not found" });
      }

      // ✅ Update chart type if changed
      if (config.chartType && config.chartType !== visualization.chartType) {
        visualization.chartType = config.chartType;
      }

      // 1️⃣ Determine new range
      const startRow = config.startRow ? Math.max(1, Number(config.startRow)) : 1;
      const endRow = config.endRow
        ? Math.min(Number(config.endRow), dataset.rows)
        : dataset.rows;

      const startIdx = startRow - 1;
      const endIdx = endRow;

      // 2️⃣ Extract relevant keys
      const selectedKeys = Object.values(config).filter(
        (val) => typeof val === "string" && dataset.columns.includes(val)
      );

      const slicedRows = (dataset.cleanedData || []).slice(startIdx, endIdx);

      const filteredPreviewData = slicedRows.map((row) => {
        const filtered = {};
        selectedKeys.forEach((key) => {
          filtered[key] = row[key];
        });
        return filtered;
      });

      // 3️⃣ Update visualization
      visualization.config = { ...visualization.config, ...config };
      visualization.previewData = filteredPreviewData;
      visualization.version = (visualization.version || 1) + 1;
      visualization.updatedAt = new Date();

      await visualization.save();
    }

    return res.status(200).json({
      success: true,
      message: "Visualization updated successfully",
      visualization,
    });
  } catch (err) {
    console.error("❌ Error updating visualization:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating visualization",
      error: err.message,
    });
  }
};
