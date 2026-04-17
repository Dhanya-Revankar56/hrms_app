const { ReportEngine } = require("./engine/reportEngine");

/**
 * 🎛 REPORT CONTROLLER
 *
 * Thin controller — all logic lives in the engine and registry.
 * Simply delegates to the ReportEngine.
 */

/**
 * GET /api/reports
 * Params:
 *   ?id=leave.history
 *   OR ?category=leave&type=history   (legacy compat)
 *   &startDate=YYYY-MM-DD
 *   &endDate=YYYY-MM-DD
 *   &download=pdf                      (omit for JSON response)
 */
exports.getReport = async (req, res) => {
  return ReportEngine.handle(req, res);
};

/**
 * GET /api/reports/meta
 * Returns all report configs grouped by category.
 * Used by the frontend to build dynamic filter UIs.
 */
exports.getReportMeta = (req, res) => {
  return ReportEngine.getMeta(req, res);
};
