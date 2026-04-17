const express = require("express");
const router = express.Router();
const ctrl = require("./controller");

/**
 * GET /api/reports/meta
 * Must be declared BEFORE the generic report route to avoid
 * "meta" being swallowed as a query param.
 */
router.get("/meta", ctrl.getReportMeta);

/**
 * GET /api/reports
 * Query params:
 *   id=<reportId>           e.g. id=leave.history
 *   category=<cat>          legacy: category=leave&type=history
 *   type=<type>
 *   startDate=YYYY-MM-DD
 *   endDate=YYYY-MM-DD
 *   departmentId=<objectId>
 *   status=<value>
 *   download=pdf            triggers PDF download instead of JSON
 */
router.get("/", ctrl.getReport);

module.exports = router;
