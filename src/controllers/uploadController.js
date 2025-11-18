// src/controllers/uploadController.js
import Dataset from "../models/Dataset.js";
import GuestSession from "../models/GuestSession.js";
import { parseFile, removeTempFile } from "../services/fileService.js";
import { preprocessData } from "../services/preprocessService.js";
import fs from "fs";

export const uploadDataset = async (req, res, next) => {
  try {
    // 1️⃣ Check if file exists
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        message: `File not found at ${filePath}`,
      });
    }

    // 2️⃣ Parse + preprocess file
    const data = await parseFile(filePath);
    const { cleanedData, columnTypes, columns } = preprocessData(data);

    // 3️⃣ Create dataset object
    const datasetObj = {
      fileName: req.file.originalname,
      rows: data.length,
      columns,
      columnTypes,
      samplePreview: data.slice(0, 10),
      originalData: data,
      cleanedData,
      isGuestFile: false, // default false
    };

    // 4️⃣ Handle Guest vs Registered user
    if (req.user?.role === "guest") {
      datasetObj.sessionId = req.user.sessionId;
      datasetObj.isGuestFile = true;
    } else if (req.user?.id) {
      datasetObj.userId = req.user.id;
    }

    // 5️⃣ Save dataset in DB
    const dataset = await Dataset.create(datasetObj);

    // 6️⃣ If guest — store reference in GuestSession
    if (req.user?.role === "guest") {
      await GuestSession.findOneAndUpdate(
        { sessionId: req.user.sessionId },
        { $addToSet: { datasets: dataset._id } },
        { upsert: true, new: true }
      );
    }

    // 7️⃣ Delete temp file after saving
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to remove temp file:", err);
    });

    // 8️⃣ Send response
    return res.status(201).json({
      success: true,
      message: "Upload successful",
      datasetId: dataset._id,
      columns,
      rows: data.length,
      samplePreview: dataset.samplePreview,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return next(err);
  }
};


// // src/controllers/uploadController.js
// import Dataset from "../models/Dataset.js";
// import GuestSession from "../models/GuestSession.js";
// import { parseFile, removeTempFile } from "../services/fileService.js";
// import { preprocessData } from "../services/preprocessService.js";
// import fs from "fs";

// /**
//  * Upload a dataset (guest or registered user)
//  * POST /api/data/upload
//  */
// // export const uploadDataset = async (req, res, next) => {
// //   try {
// //     // 1️⃣ Ensure file is uploaded
// //     if (!req.file)
// //       return res.status(400).json({ success: false, message: "No file uploaded" });

// //     const filePath = req.file.path;
// //     if (!fs.existsSync(filePath)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `File not found at ${filePath}`,
// //       });
// //     }

// //     // 2️⃣ Parse + preprocess
// //     const data = await parseFile(filePath);
// //     const { cleanedData, columnTypes, columns } = preprocessData(data);

// //     // 3️⃣ Build dataset document
// //     const datasetObj = {
// //       fileName: req.file.originalname,
// //       rows: data.length,
// //       columns,
// //       columnTypes,
// //       samplePreview: data.slice(0, 10),
// //       originalData: data,
// //       cleanedData,
// //       isGuestFile: false,
// //     };

// //     // 4️⃣ Identify user or guest
// //     if (req.user?.role === "guest" && req.user.sessionId) {
// //       datasetObj.sessionId = req.user.sessionId;
// //       datasetObj.isGuestFile = true;
// //     } else if (req.user?.id) {
// //       datasetObj.userId = req.user.id;
// //     } else {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Unauthorized upload — missing user/session ID",
// //       });
// //     }

// //     // 5️⃣ Save dataset
// //     const dataset = await Dataset.create(datasetObj);

// //     // 6️⃣ If guest, store reference
// //     if (req.user?.role === "guest") {
// //       await GuestSession.findOneAndUpdate(
// //         { sessionId: req.user.sessionId },
// //         { $addToSet: { datasets: dataset._id } },
// //         { upsert: true, new: true }
// //       );
// //     }

// //     // 7️⃣ Cleanup temp file
// //     fs.unlink(filePath, (err) => {
// //       if (err) console.error("Failed to remove temp file:", err);
// //     });

// //     // 8️⃣ Send response
// //     return res.status(201).json({
// //       success: true,
// //       message: "Dataset uploaded successfully",
// //       dataset: {
// //         id: dataset._id,
// //         fileName: dataset.fileName,
// //         columns: dataset.columns,
// //         totalRows: dataset.rows,
// //         isGuestFile: dataset.isGuestFile,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("Upload error:", err);
// //     return next(err);
// //   }
// // };

// /**
//  * Upload a dataset (works for both guests and registered users)
//  */
// export const uploadDataset = async (req, res) => {
//   try {
//     // 🧠 Identify the uploader
//     const { user } = req;

//     if (!user) {
//       return res.status(401).json({ success: false, message: "Unauthorized upload — missing user/session ID" });
//     }

//     // ✅ Case 1: Guest upload
//     let sessionId = null;
//     let userId = null;
//     let isGuestFile = false;

//     if (user.isGuest) {
//       sessionId = user.sessionId;
//       isGuestFile = true;
//     } else {
//       userId = user.id;
//     }

//     // 🗂️ Assume you already handled file saving and parsing logic before this
//     // (for now just mock it)
//     const dataset = await Dataset.create({
//       name: req.file?.originalname || "Untitled",
//       path: req.file?.path || "",
//       userId,
//       sessionId,
//       isGuestFile,
//       uploadedAt: new Date(),
//     });

//     // 🔗 If guest — link dataset to guest session record
//     if (isGuestFile) {
//       await GuestSession.findOneAndUpdate(
//         { sessionId },
//         { $addToSet: { datasets: dataset._id } },
//         { upsert: true, new: true }
//       );
//     }

//     res.status(200).json({
//       success: true,
//       message: "Upload successful",
//       datasetId: dataset._id,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ success: false, message: "File upload failed", error: err.message });
//   }
// };



export const getPreview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    // --- Safe access control ---
    if (req.user) {
      // If logged in, allow access only to own datasets (unless admin)
      if (
        req.user.role !== "admin" && 
        dataset.userId && 
        dataset.userId.toString() !== req.user.id.toString()
      ) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } else {
      // If no req.user (guest), allow only datasets that are marked as guest
      if (!dataset.isGuestFile) {
        return res.status(403).json({ success: false, message: "Access denied for guest" });
      }
    }

    // --- Successful preview response ---
    res.status(200).json({
      success: true,
      datasetId: dataset._id,
      filename: dataset.fileName,
      columns: dataset.columns,
      sampleRows: dataset.samplePreview
    });

  } catch (err) {
    next(err);
  }
};



/**
 * POST /api/data/configure
 * Save chart configuration + selected columns + row range
 */
// export const saveConfig = async (req, res, next) => {
//   try {
//     const { datasetId, chartType, xAxis, yAxis, startRow, endRow } = req.body;

//     const dataset = await Dataset.findById(datasetId);
//     if (!dataset)
//       return res.status(404).json({ success: false, message: "Dataset not found" });

//     // Validate column names
//     if (!dataset.columns.includes(xAxis) || !dataset.columns.includes(yAxis)) {
//       return res.status(400).json({ success: false, message: "Invalid columns selected" });
//     }

//     // Validate row range
//     const totalRows = dataset.cleanedData.length;
//     const start = parseInt(startRow);
//     const end = parseInt(endRow);
//     if (isNaN(start) || isNaN(end) || start < 0 || end > totalRows || start >= end) {
//       return res.status(400).json({ success: false, message: "Invalid row range" });
//     }

//     dataset.config = { chartType, xAxis, yAxis, startRow: start, endRow: end };
//     await dataset.save();

//     res.json({ success: true, message: "Configuration saved", config: dataset.config });

//   } catch (err) {
//     next(err);
//   }
// };

export const saveConfig = async (req, res, next) => {
  try {
    const { datasetId, chartType, startRow, endRow, ...fields } = req.body;

    // 1️⃣ Validate dataset existence
    const dataset = await Dataset.findById(datasetId);
    if (!dataset)
      return res.status(404).json({ success: false, message: "Dataset not found" });

    const totalRows = dataset.cleanedData?.length || 0;

    // 2️⃣ Validate row range
    const start = parseInt(startRow);
    const end = parseInt(endRow);
    if (
      isNaN(start) ||
      isNaN(end) ||
      start < 1 ||
      end > totalRows ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid row range (startRow: ${start}, endRow: ${end})`,
      });
    }

    // 3️⃣ Validate column names dynamically
    const invalidColumns = Object.values(fields).filter(
      (col) => col && !dataset.columns.includes(col)
    );

    if (invalidColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid column(s): ${invalidColumns.join(", ")}`,
      });
    }

    // 4️⃣ Save flexible config
    dataset.config = {
      chartType,
      startRow: start,
      endRow: end,
      ...fields, // dynamically store all chart-specific columns
    };

    await dataset.save();

    res.json({
      success: true,
      message: "Configuration saved successfully",
      config: dataset.config,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/data/final-preview/:id
 * Returns selected columns and row range as configured
 */  
// export const getFinalPreview = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const dataset = await Dataset.findById(id);
//     if (!dataset)
//       return res.status(404).json({ success: false, message: "Dataset not found" });

//     // 1️⃣ Use query params if provided, otherwise fallback to saved config
//     const xAxis = req.query.xAxis || dataset.config?.xAxis;
//     const yAxis = req.query.yAxis || dataset.config?.yAxis;
//     const startRow = req.query.startRow ? parseInt(req.query.startRow) : dataset.config?.startRow;
//     const endRow = req.query.endRow ? parseInt(req.query.endRow) : dataset.config?.endRow;

//     if (!xAxis || !yAxis || startRow === undefined || endRow === undefined) {
//       return res.status(400).json({ success: false, message: "No configuration found for dataset" });
//     }

//     // 2️⃣ Slice the data and map to arrays for frontend
//     const sampleRows = dataset.cleanedData
//       .slice(startRow, endRow)
//       .map(row => [row[xAxis], row[yAxis]]);

//     res.json({
//       success: true,
//       datasetId: dataset._id,
//       columns: [xAxis, yAxis],
//       sampleRows
//     });

//   } catch (err) {
//     next(err);
//   }
// };

// export const getFinalPreview = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const dataset = await Dataset.findById(id);
//     if (!dataset)
//       return res.status(404).json({ success: false, message: "Dataset not found" });

//     const config = dataset.config;
//     if (!config)
//       return res.status(400).json({ success: false, message: "No configuration saved for this dataset" });

//     const { startRow, endRow, chartType, ...cols } = config;

//     const totalRows = dataset.cleanedData?.length || 0;
//     const start = parseInt(startRow);
//     const end = parseInt(endRow);

//     // slice the configured data
//     const slicedData = dataset.cleanedData.slice(start - 1, end);

//     // collect used columns dynamically from config
//     const selectedCols = Object.values(cols).filter(Boolean);

//     // only keep those columns in each row
//     const filteredData = slicedData.map((row) => {
//       const filteredRow = {};
//       selectedCols.forEach((col) => (filteredRow[col] = row[col]));
//       return filteredRow;
//     });

//     res.json({
//       success: true,
//       datasetId: dataset._id,
//       columns: selectedCols,
//       data: filteredData,
//       configUsed: config,
//       rowsCount: filteredData.length,
//       totalRows,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// ----------------------Last Working-------------------------
export const getFinalPreview = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1) Find dataset
    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    const totalRows = Array.isArray(dataset.cleanedData) ? dataset.cleanedData.length : 0;

    // 2) Merge saved config with any query overrides
    //    (query is handy for debugging/testing different ranges or columns)
    const saved = dataset.config || {};
    const merged = { ...saved, ...req.query };

    // 3) Extract and validate row range (1-based input)
    const start = parseInt(merged.startRow, 10);
    const end   = parseInt(merged.endRow, 10);

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 1 ||
      end > totalRows ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid row range (startRow: ${merged.startRow}, endRow: ${merged.endRow}, totalRows: ${totalRows})`,
      });
    }

    // 4) Build a lookup to normalize/resolve column names (trim + lowercase)
    const norm = (s) => String(s || "").trim();
    const toKey = (s) => norm(s).toLowerCase();

    const columnLookup = new Map(
      (dataset.columns || []).map((col) => [toKey(col), col]) // normalized -> actual
    );

    // 5) Collect dynamic columns from config (exclude known non-column keys)
    const { chartType, startRow, endRow, ...fieldCols } = merged;

    // Resolve each configured column to the actual dataset column name
    const selectedColumns = Object.values(fieldCols)
      .filter(Boolean)
      .map((c) => columnLookup.get(toKey(c))) // resolve normalized to actual
      .filter(Boolean); // drop any that didn't resolve

    if (!selectedColumns.length) {
      return res.status(400).json({
        success: false,
        message: "No valid columns found in configuration (check column names/spaces).",
      });
    }

    // 6) Slice the data (convert to 0-based indices)
    const sliceStart = start - 1;
    const sliceEnd = end; // slice is non-inclusive, so this is correct
    const dataSlice = dataset.cleanedData.slice(sliceStart, sliceEnd);

    // 7) Keep only the selected columns for each row
    const formattedData = dataSlice.map((row) => {
      const obj = {};
      selectedColumns.forEach((col) => {
        obj[col] = row[col];
      });
      return obj;
    });

    // 8) Respond
    return res.json({
      success: true,
      datasetId: dataset._id,
      columns: selectedColumns,
      data: formattedData,
      configUsed: { ...merged, startRow: start, endRow: end }, // echo normalized values
      rowsCount: formattedData.length,
      totalRows,
    });
  } catch (err) {
    next(err);
  }
};

