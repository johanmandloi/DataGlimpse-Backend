// src/services/preprocessService.js
export const preprocessData = (data) => {
  if (!data || data.length === 0) return { cleanedData: [], columnTypes: {}, summary: {} };

  const cleanedData = [];
  const columnTypes = {};
  const summary = {};

  const columns = Object.keys(data[0]);

  // Initialize summary
  columns.forEach(col => {
    columnTypes[col] = "unknown";
    summary[col] = { missing: 0, type: null, min: null, max: null, mean: null };
  });

  data.forEach(row => {
    const newRow = {};
    columns.forEach(col => {
      let val = row[col];
      if (typeof val === "string") val = val.trim();
      if (val === null || val === undefined || val === "") {
        summary[col].missing += 1;
      }
      newRow[col] = val;
    });
    cleanedData.push(newRow);
  });

  // Detect types (basic)
  columns.forEach(col => {
    const colValues = cleanedData.map(r => r[col]).filter(v => v !== "");
    if (colValues.every(v => !isNaN(Number(v)))) {
      columnTypes[col] = "numeric";
      const numbers = colValues.map(Number);
      summary[col].type = "numeric";
      summary[col].min = Math.min(...numbers);
      summary[col].max = Math.max(...numbers);
      summary[col].mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    } else if (colValues.every(v => !isNaN(Date.parse(v)))) {
      columnTypes[col] = "date";
      summary[col].type = "date";
    } else {
      columnTypes[col] = "text";
      summary[col].type = "text";
    }
  });

  return { cleanedData, columnTypes, summary, columns };
};
