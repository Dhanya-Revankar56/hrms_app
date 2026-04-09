const express = require("express");
const router = express.Router();
const reportController = require("./controller");

// Main report endpoint
router.get("/", reportController.getReports);

module.exports = router;
