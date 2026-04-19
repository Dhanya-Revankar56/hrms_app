const fs = require("fs");
const path = require("path");

const root = path.join("c:", "projects", "hrms_app", "backend", "scripts");

// Create directories
const dirs = [
  "db/seed",
  "db/migrations",
  "dev-tools/api-tests",
  "dev-tools/db-utils",
  "dev-tools/diagnostics",
  "dev-tools/dangerous",
  "archive",
];

dirs.forEach((d) => {
  const p = path.join(root, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// Map of source -> dest
const moves = [
  // SEED
  ["seed.js", "db/seed/seed.js"],
  ["seed-superadmin.js", "db/seed/seed-superadmin.js"],
  ["seed-beta-admin.js", "db/seed/seed-beta-admin.js"],

  // MIGRATIONS
  [
    "migration/migrate-designations.js",
    "db/migrations/001_migrate_designations.js",
  ],
  ["migrate_v2_tenant_code.js", "db/migrations/002_migrate_tenant_code.js"],
  [
    "migrate_v3_global_scoping.js",
    "db/migrations/003_migrate_global_scoping.js",
  ],
  [
    "migrate-to-strict-tenancy.js",
    "db/migrations/004_migrate_to_strict_tenancy.js",
  ],
  [
    "migration/migrate-leavetypes.js",
    "db/migrations/005_migrate_leavetypes.js",
  ],
  [
    "migrations/fix_legacy_approvals.js",
    "db/migrations/006_fix_legacy_approvals.js",
  ],

  // DEV-TOOLS : DB-UTILS
  [
    "detect-tenant-duplicates.js",
    "dev-tools/db-utils/detect-tenant-duplicates.js",
  ],
  ["cleanup_zombie.js", "dev-tools/db-utils/cleanup_zombie.js"],
  ["repair-auth.js", "dev-tools/db-utils/repair-auth.js"],
  ["inspect_db.js", "dev-tools/db-utils/inspect_db.js"],
  ["dump-employees.js", "dev-tools/db-utils/dump-employees.js"],
  ["maintenance/verify_migration.js", "dev-tools/db-utils/verify_migration.js"],
  [
    "maintenance/find_pending_leave.js",
    "dev-tools/db-utils/find_pending_leave.js",
  ],
  [
    "maintenance/ultimate_reconcile.js",
    "dev-tools/db-utils/reconcile_db_state.js",
  ],

  // DEV-TOOLS : API-TESTS
  ["test_graphql.js", "dev-tools/api-tests/test_graphql.js"],
  ["test_http.js", "dev-tools/api-tests/test_http.js"],
  ["verify_fetch.js", "dev-tools/api-tests/verify_fetch.js"],
  ["verify_services.js", "dev-tools/api-tests/verify_services.js"],
  [
    "diagnostics/verify_gql_schema.js",
    "dev-tools/api-tests/verify_gql_schema.js",
  ],

  // DEV-TOOLS : DIAGNOSTICS
  ["diag_relieving.js", "dev-tools/diagnostics/diag_relieving.js"],
  [
    "diagnostics/check_emp_insts.js",
    "dev-tools/diagnostics/check_emp_insts.js",
  ],
  ["diagnostics/check_insts.js", "dev-tools/diagnostics/check_insts.js"],
  [
    "diagnostics/check_leave_insts.js",
    "dev-tools/diagnostics/check_leave_insts.js",
  ],
  ["diagnostics/check_settings.js", "dev-tools/diagnostics/check_settings.js"],
  [
    "diagnostics/inspect_all_work_details.js",
    "dev-tools/diagnostics/inspect_all_work_details.js",
  ],
  ["diagnostics/inspect_emp.js", "dev-tools/diagnostics/inspect_emp.js"],

  // DEV-TOOLS : DANGEROUS
  ["maintenance/reset_employees.js", "dev-tools/dangerous/reset_employees.js"],

  // ARCHIVE
  ["maintenance/reconcile.js", "archive/reconcile.js"],
  ["maintenance/final_reconcile.js", "archive/final_reconcile.js"],
  ["maintenance/final_final_reconcile.js", "archive/final_final_reconcile.js"],
  ["maintenance/aggressive_reconcile.js", "archive/aggressive_reconcile.js"],
  ["diagnostics/search_campus_alpha.js", "archive/search_campus_alpha.js"],
];

moves.forEach(([src, dest]) => {
  const srcPath = path.join(root, src);
  const destPath = path.join(root, dest);
  if (fs.existsSync(srcPath)) {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${src} -> ${dest}`);
  } else {
    console.log(`Missing: ${src}`);
  }
});

// Remove old empty directories if they exist and are empty
const oldDirs = ["diagnostics", "maintenance", "migration", "migrations"];
oldDirs.forEach((d) => {
  const dirPath = path.join(root, d);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmdirSync(dirPath);
      console.log(`Removed empty dir: ${d}`);
    } catch (e) {
      console.log(`Could not remove dir: ${d} (might not be empty)`);
    }
  }
});
