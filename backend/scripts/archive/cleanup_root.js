const fs = require("fs");
const path = require("path");

const root = path.join("c:", "projects", "hrms_app", "backend");

// Ensure Logs folder exists
const logsDir = path.join(root, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const moves = [
  // SEED
  ["seed_user.js", "scripts/db/seed/seed_user.js"],

  // DB-UTILS
  ["backfill_audit.js", "scripts/dev-tools/db-utils/backfill_audit.js"],
  ["backfill_fuzzy.js", "scripts/dev-tools/db-utils/backfill_fuzzy.js"],
  ["check_audit_logs.js", "scripts/dev-tools/db-utils/check_audit_logs.js"],
  ["check_db.js", "scripts/dev-tools/db-utils/check_db.js"],
  ["check_leaves_v5.js", "scripts/dev-tools/db-utils/check_leaves.js"],
  [
    "verify_analytics_fix.js",
    "scripts/dev-tools/db-utils/verify_analytics_fix.js",
  ],
  ["verify_audit_fix.js", "scripts/dev-tools/db-utils/verify_audit_fix.js"],
  [
    "verify_dashboard_fix_v2.js",
    "scripts/dev-tools/db-utils/verify_dashboard_fix.js",
  ],
  ["verify_hiding_fix.js", "scripts/dev-tools/db-utils/verify_hiding_fix.js"],
  ["verify_id_fix_v4.js", "scripts/dev-tools/db-utils/verify_id_fix.js"],
  [
    "verify_movement_logic.js",
    "scripts/dev-tools/db-utils/verify_movement_logic.js",
  ],
  ["verify_name_fix.js", "scripts/dev-tools/db-utils/verify_name_fix.js"],
  [
    "verify_relieved_fix.js",
    "scripts/dev-tools/db-utils/verify_relieved_fix.js",
  ],

  // DIAGNOSTICS
  ["debug_report.js", "scripts/dev-tools/diagnostics/debug_report.js"],
  [
    "diagnostic_report.js",
    "scripts/dev-tools/diagnostics/diagnostic_report.js",
  ],

  // ARCHIVE
  ["check_leaves_v3.js", "scripts/archive/check_leaves_v3.js"],
  ["check_leaves_v4.js", "scripts/archive/check_leaves_v4.js"],
  ["verify_id_fix.js", "scripts/archive/verify_id_fix.js"],
  ["verify_id_fix_v2.js", "scripts/archive/verify_id_fix_v2.js"],
  ["verify_id_fix_v3.js", "scripts/archive/verify_id_fix_v3.js"],

  // LOGS
  ["audit_log.txt", "logs/audit_log.txt"],
];

moves.forEach(([src, dest]) => {
  const srcPath = path.join(root, src);
  const destPath = path.join(root, dest);
  if (fs.existsSync(srcPath)) {
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${src} -> ${dest}`);
  } else {
    console.log(`Missing: ${src}`);
  }
});

// Optionally handling tmp/ and scratch/ if needed. We leave them intact per caution requested, other than possibly temp files, but user didn't specify which.

console.log("Root cleanup completed.");
