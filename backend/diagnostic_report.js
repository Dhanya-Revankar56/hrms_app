require("dotenv").config();
const { ReportEngine } = require("./src/modules/reports/engine/reportEngine");
const connectDB = require("./src/config/db");
require("./src/modules/employee/model"); // Ensure models are registered
require("./src/modules/settings/model");

async function testReport() {
  await connectDB();

  // Mock req and res
  const req = {
    query: {
      id: "leave.daily",
      selectedDate: "2024-04-20",
      download: "pdf",
    },
    user: {
      tenant_id: "69cf9ab6ba557bc5c95ede7c", // Test Dept A
      role: "ADMIN",
    },
    headers: {},
  };

  const res = {
    status: (code) => {
      console.log("Status:", code);
      return res;
    },
    json: (obj) => {
      console.log("JSON Response:", JSON.stringify(obj, null, 2));
      return res;
    },
    setHeader: (k, v) => {
      console.log("Header:", k, "=", v);
    },
    end: (buf) => {
      console.log("PDF generated successfully. Buffer size:", buf.length);
      process.exit(0);
    },
    send: (_content) => {
      console.log("Content sent.");
      process.exit(0);
    },
  };

  console.log("Starting report generation test...");
  try {
    // We need to run this in a tenant context because deep levels still check it
    const { runWithTenant } = require("./src/middleware/tenantContext");
    await runWithTenant(
      { tenantId: req.user.tenant_id, role: req.user.role },
      async () => {
        await ReportEngine.handle(req, res);
      },
    );
  } catch (err) {
    console.error("Test Failed with Error:");
    console.error(err);
    process.exit(1);
  }
}

testReport();
