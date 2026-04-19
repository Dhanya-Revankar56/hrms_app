const fs = require("fs");

// 1. employee.list preFilter
const empReports = require("./src/modules/reports/registry/employee.reports.js");
const empList = empReports.find((r) => r.id === "employee.list");
const empExit = empReports.find((r) => r.id === "employee.exit");

console.log("\n=== Employee List Fix ===");
console.log("preFilter:", JSON.stringify(empList.preFilter));
console.log(
  "Has no status filter field:",
  !empList.filters.some((f) => f.applyTo === "status")
    ? "✅ CORRECT"
    : "❌ still has status filter",
);

console.log("\n=== Exit Report ===");
console.log("preFilter:", JSON.stringify(empExit.preFilter));

// 2. pdfBuilder uses Settings
const pb = fs.readFileSync(
  "./src/modules/reports/renderers/pdfBuilder.js",
  "utf8",
);
console.log("\n=== PDF Builder ===");
console.log(
  "Uses Settings model:",
  pb.includes("settings/model") ? "✅ YES" : "❌ NO",
);
console.log(
  "Has getInstitutionInfo:",
  pb.includes("getInstitutionInfo") ? "✅ YES" : "❌ NO",
);
console.log(
  "Reads institution_name:",
  pb.includes("institution_name") ? "✅ YES" : "❌ NO",
);
console.log(
  "Reads institution_logo:",
  pb.includes("institution_logo") ? "✅ YES" : "❌ NO",
);
console.log(
  "Reads contact_email:",
  pb.includes("contact_email") ? "✅ YES" : "❌ NO",
);
console.log(
  "Reads address:",
  pb.includes("address?.line1") ? "✅ YES" : "❌ NO",
);

// 3. Template logo conditional
const baseHbs = fs.readFileSync(
  "./src/modules/reports/templates/base-report.hbs",
  "utf8",
);
const leaveHbs = fs.readFileSync(
  "./src/modules/reports/templates/leave-report.hbs",
  "utf8",
);
const empHbs = fs.readFileSync(
  "./src/modules/reports/templates/employee-list.hbs",
  "utf8",
);
const attHbs = fs.readFileSync(
  "./src/modules/reports/templates/attendance-report.hbs",
  "utf8",
);
const movHbs = fs.readFileSync(
  "./src/modules/reports/templates/movement-report.hbs",
  "utf8",
);

console.log("\n=== Template Logo Conditional ===");
[
  ["base-report", baseHbs],
  ["leave-report", leaveHbs],
  ["employee-list", empHbs],
  ["attendance-report", attHbs],
  ["movement-report", movHbs],
].forEach(([name, content]) => {
  const hasLogoIf = content.includes("institution.logo");
  const hasLogoImg = content.includes("letterhead-logo-img");
  const hasAddress = content.includes("institution.address");
  const hasEmail = content.includes("institution.email");
  console.log(
    `${name}: logo=${hasLogoIf ? "✅" : "❌"} img-class=${hasLogoImg ? "✅" : "❌"} address=${hasAddress ? "✅" : "❌"} email=${hasEmail ? "✅" : "❌"}`,
  );
});

console.log("\n✅ All checks complete");
