// src/services/fileService.js
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import csv from "csvtojson";

export const parseFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let jsonData = [];

  if (ext === ".csv") {
    jsonData = await csv().fromFile(filePath);
  } else if (ext === ".xlsx") {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else {
    throw new Error("Unsupported file type");
  }

  return jsonData;
};

// Optional: remove temp file after parsing
export const removeTempFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete temp file:", err);
  });
};
