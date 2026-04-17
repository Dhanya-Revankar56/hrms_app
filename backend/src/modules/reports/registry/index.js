/**
 * 📚 REPORT REGISTRY — Index
 *
 * Merges all category registries into a single lookup map:
 *   { "leave.history": { ...config }, "attendance.daily": { ...config }, ... }
 *
 * To add a new category:
 *   1. Create registry/<category>.reports.js
 *   2. Require and spread it here
 */

const employeeReports = require("./employee.reports");
const leaveReports = require("./leave.reports");
const attendanceReports = require("./attendance.reports");
const movementReports = require("./movement.reports");
const holidayReports = require("./holiday.reports");
const systemReports = require("./systems.reports");

// Merge all report arrays into a single flat array
const ALL_REPORTS = [
  ...employeeReports,
  ...leaveReports,
  ...attendanceReports,
  ...movementReports,
  ...holidayReports,
  ...systemReports,
];

// Build lookup map: id → config
const REGISTRY = {};
for (const report of ALL_REPORTS) {
  if (!report.id) {
    console.warn("[ReportRegistry] Skipping report with missing id:", report);
    continue;
  }
  REGISTRY[report.id] = report;
}

/**
 * Look up a report config by its id string.
 * @param {string} id - e.g. "leave.history"
 * @returns {Object|null}
 */
const getConfig = (id) => REGISTRY[id] || null;

/**
 * Get all report configs grouped by category.
 * Used by the /api/reports/meta endpoint for frontend-driven filter UI.
 */
const getAllByCategory = () => {
  const grouped = {};
  for (const report of ALL_REPORTS) {
    const cat = report.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      id: report.id,
      label: report.label,
      filters: (report.filters || []).map((f) => ({
        key: f.key,
        type: f.type,
        label: f.label || f.key,
      })),
    });
  }
  return grouped;
};

module.exports = { REGISTRY, getConfig, getAllByCategory };
