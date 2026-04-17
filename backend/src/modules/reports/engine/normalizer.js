/**
 * 🔧 NORMALIZER
 * Converts raw Mongoose document(s) into flat row objects for rendering.
 * Uses the report config's `fieldMap` to know which fields to extract
 * and what column labels to use — no hardcoding per report type.
 *
 * fieldMap structure:
 *   { "db.path.to.field": "Column Label", ... }
 *
 * Nested paths like "employee_id.name" are safely traversed using
 * a built-in deep-get helper (no external dependencies).
 */

/**
 * Safely get a deeply nested value from an object using a dot-separated path.
 * Works the same as lodash.get but with zero dependencies.
 *
 * @param {Object} obj  - The source object (Mongoose doc)
 * @param {string} path - Dot-separated path e.g. "work_detail.department.name"
 * @returns {*}         - The value at that path, or undefined
 */
const deepGet = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
};

/**
 * Format a single raw value for display.
 * Dates → locale string, booleans → Yes/No, nulls → N/A
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (value instanceof Date) return value.toLocaleDateString("en-IN");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value;
  // Handle Mongoose ObjectIds
  if (typeof value === "object" && value._bsontype === "ObjectID")
    return value.toString();
  const str = String(value).trim();
  return str === "" ? "N/A" : str;
};

/**
 * Normalize a single Mongoose document using a fieldMap.
 *
 * @param {Object} doc       - Raw lean Mongoose document
 * @param {Object} fieldMap  - Map of { "dotted.path": "Column Label" }
 * @returns {Object}         - Flat { "Column Label": value } object
 */
const normalizeRow = (doc, fieldMap) => {
  const row = {};
  for (const [path, label] of Object.entries(fieldMap)) {
    // Synthetic pivot fields (e.g., __lt_Casual Leave_used) are set
    // directly on the doc — look them up as direct keys to avoid
    // dot-splitting issues with leave type names that contain dots.
    const raw = path.startsWith("__") ? doc[path] : deepGet(doc, path);
    row[label] = formatValue(raw);
  }
  return row;
};

/**
 * Normalize an array of documents.
 *
 * @param {Array}  docs      - Array of raw lean Mongoose documents
 * @param {Object} fieldMap  - The report config's fieldMap
 * @returns {Array}          - Array of flat row objects
 */
const normalizeData = (docs, fieldMap) => {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc) => normalizeRow(doc, fieldMap));
};

/**
 * Extract column headers (in order) from a fieldMap.
 * Returns the display label strings as an array.
 */
const getColumns = (fieldMap) => Object.values(fieldMap);

module.exports = { normalizeData, normalizeRow, getColumns, deepGet };
