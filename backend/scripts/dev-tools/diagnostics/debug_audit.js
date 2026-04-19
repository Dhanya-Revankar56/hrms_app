const mongoose = require("mongoose");
const { AsyncLocalStorage } = require("async_hooks");

// Mock context to simulate middleware
const store = new AsyncLocalStorage();
global.AsyncLocalStorage = store;

async function debugReport() {
  await mongoose.connect(
    "mongodb+srv://dhanyavernekar_db_user:Dhanya2026@cluster0.t9urwje.mongodb.net/hrms",
  );

  const tenantId = "69cf9ab6ba557bc5c95ede7c"; // COLLEGE_A
  const hodUserId = "69cf9ab7ba557bc5c95ede95"; // The HOD user
  const deptId = "69b3b2faa89d1c60da84b708"; // Data Science

  // Simulate being in the request context
  await store.run({ tenantId }, async () => {
    const Employee = require("./backend/src/modules/employee/model");
    const eventLogService = require("./backend/src/modules/eventLog/service");

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
    const date_to = new Date("2026-04-18T23:59:59.999Z"); // Inclusive tomorrow just to be safe

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
    }

    process.exit();
  });
}

debugReport();
