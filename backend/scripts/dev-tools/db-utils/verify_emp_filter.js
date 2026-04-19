const path = require("path");
const base = "C:/projects/hrms_app/backend";
const empReports = require(
  path.join(base, "src/modules/reports/registry/employee.reports.js"),
);

const empList = empReports.find((r) => r.id === "employee.list");
const empExit = empReports.find((r) => r.id === "employee.exit");
const empNew = empReports.find((r) => r.id === "employee.new-joiners");

console.log("=== preFilter check ===");
console.log("employee.list  preFilter:", JSON.stringify(empList.preFilter));
console.log("employee.exit  preFilter:", JSON.stringify(empExit.preFilter));
console.log(
  "employee.new-joiners preFilter:",
  empNew.preFilter ? JSON.stringify(empNew.preFilter) : "none (all employees)",
);

// Simulate queryEngine
const filter = {};
Object.assign(filter, empList.preFilter);
console.log("\n=== Simulated MongoDB filter for employee.list ===");
console.log(JSON.stringify(filter, null, 2));

// Verify it matches employee service
const serviceFilter = { is_active: { $ne: false } };
console.log("\n=== Employee service filter (listEmployees) ===");
console.log(JSON.stringify(serviceFilter, null, 2));

const match = JSON.stringify(filter) === JSON.stringify(serviceFilter);
console.log("\nFilters match:", match ? "YES - PASS" : "NO - FAIL");

// Check exit filter
const exitFilter = {};
Object.assign(exitFilter, empExit.preFilter);
console.log("\n=== Exit report filter ===");
console.log(JSON.stringify(exitFilter, null, 2));
console.log(
  "Uses is_active: false:",
  exitFilter.is_active === false ? "YES - PASS" : "NO - FAIL",
);
