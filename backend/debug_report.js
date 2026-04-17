const mongoose = require("mongoose");
const path = require("path");
const tenantContext = require("./src/middleware/tenantContext");

async function debugReport() {
  await mongoose.connect(
    "mongodb+srv://dhanyavernekar_db_user:Dhanya2026@cluster0.t9urwje.mongodb.net/hrms",
  );

  const tenantIdStr = "69cf9ab6ba557bc5c95ede7c"; // COLLEGE_A
  const tenantId = new mongoose.Types.ObjectId(tenantIdStr);
  const deptId = "69b3b2faa89d1c60da84b708"; // Data Science

  // Simulate being in the request context
  await tenantContext.runWithTenant({ tenantId }, async () => {
    const Employee = require("./src/modules/employee/model");
    const eventLogService = require("./src/modules/eventLog/service");
    const AuditLog = require("./src/modules/audit/model");

    // 0. Check total audit logs in DB
    const totalLogs = await AuditLog.countDocuments({ tenant_id: tenantId });
    console.log("Total Logs in DB for tenant:", totalLogs);

    // 1. Resolve IDs like queryEngine.js does
    const employees = await Employee.find({
      "work_detail.department": new mongoose.Types.ObjectId(deptId),
    })
      .select("_id user_id")
      .lean();
    const actorIds = employees
      .map((e) => e.user_id?.toString())
      .filter((id) => id);
    const targetIds = employees.map((e) => e._id.toString());

    console.log("Actor IDs:", actorIds.length);
    console.log("Target IDs:", targetIds.length);

    // 2. Call service with inclusive dates
    const date_from = new Date("2015-01-01T00:00:00.000Z");
    const date_to = new Date("2026-04-18T23:59:59.999Z");

    const args = {
      user_id: actorIds,
      record_id: targetIds,
      date_from,
      date_to,
      pagination: { limit: 100, page: 1 },
    };

    const result = await eventLogService.listEventLogs(args);
    console.log("Result Count:", result.items.length);

    if (result.items.length > 0) {
      console.log("Sample Action:", result.items[0].description);
      console.log("Sample Action User Name:", result.items[0].user_name);
    } else {
      console.log("Still 0. Checking if individual matches work...");
      // Check actorIds matches
      const actorMatch = await AuditLog.countDocuments({
        tenant_id: tenantId,
        user_id: { $in: actorIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
      console.log("Actor Match Count:", actorMatch);

      // Check targetIds matches
      const targetMatch = await AuditLog.countDocuments({
        tenant_id: tenantId,
        "metadata.employee_id": {
          $in: targetIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });
      console.log("Target Match Count (metadata.employee_id):", targetMatch);
    }

    process.exit();
  });
}

debugReport();
