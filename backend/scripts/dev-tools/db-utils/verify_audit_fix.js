const mongoose = require("mongoose");
require("dotenv").config();
const {
  applyLeave,
  updateLeave,
  cancelLeave,
} = require("./src/modules/leave/service");
const {
  createMovement,
  updateMovement,
} = require("./src/modules/movement/service");
const {
  createRelieving,
  updateRelieving,
} = require("./src/modules/relieving/service");
const { runWithTenant } = require("./src/middleware/tenantContext");
const Employee = require("./src/modules/employee/model");
const AuditLog = require("./src/modules/audit/model");

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const emp = await Employee.findOne().lean();
  if (!emp) {
    process.exit(0);
  }

  const ctx = { tenantId: emp.tenant_id, user: { id: emp.user_id } };

  await runWithTenant({ tenantId: emp.tenant_id }, async () => {
    // 1. Leave Apply (noise check)
    const leave = await applyLeave(
      {
        employee_id: emp._id,
        leave_type: "Casual Leave",
        from_date: "2027-10-01",
        to_date: "2027-10-02",
      },
      ctx,
    );
    const applyLog = await AuditLog.findOne({
      action: "LEAVE_APPLY",
      "metadata.leave_id": leave._id,
    });
    console.log(
      applyLog ? "❌ LEAVE_APPLY still exists" : "✅ LEAVE_APPLY removed",
    );

    // 2. Leave Update (date change)
    await updateLeave(leave._id, { to_date: "2027-10-03" }, ctx);
    const updateLog = await AuditLog.findOne({
      action: "LEAVE_UPDATED",
      "metadata.record_id": leave._id.toString(),
    });
    // Wait, updateLeave uses eventLogService which logs as action_type || ${module}_${action}
    // and AuditLog.create. In my fix I kept logEvent.
    console.log(
      updateLog ? "✅ LEAVE_UPDATED found" : "❌ LEAVE_UPDATED missing",
    );

    // 3. Leave Cancel
    await cancelLeave(leave._id, ctx);
    const cancelLog = await AuditLog.findOne({
      action: "LEAVE_CANCELLED",
      "metadata.leave_id": leave._id,
    });
    console.log(
      cancelLog ? "✅ LEAVE_CANCELLED found" : "❌ LEAVE_CANCELLED missing",
    );

    // 4. Movement Apply
    const move = await createMovement(
      {
        employee_id: emp._id,
        movement_date: "2027-10-05",
        movement_type: "official",
        out_time: "10:00",
        purpose: "Test",
      },
      ctx,
    );
    const moveApplyLog = await AuditLog.findOne({
      action: "MOVEMENT_APPLY",
      "metadata.movement_id": move._id,
    });
    console.log(
      moveApplyLog
        ? "❌ MOVEMENT_APPLY still exists"
        : "✅ MOVEMENT_APPLY removed",
    );

    // 5. Movement Update (time change)
    await updateMovement(move._id, { in_time: "11:00" }, ctx);
    const moveUpdateLog = await AuditLog.findOne({
      action: "MOVEMENT_UPDATED",
      "metadata.movement_id": move._id,
    });
    console.log(
      moveUpdateLog
        ? "✅ MOVEMENT_UPDATED found"
        : "❌ MOVEMENT_UPDATED missing",
    );

    // 6. Relieving Create
    const rel = await createRelieving(
      {
        employee_id: emp._id,
        resignation_date: "2027-12-01",
        reason: "Testing",
      },
      ctx,
    );
    const relCreateLog = await AuditLog.findOne({
      action: "RELIEVE_CREATE",
      "metadata.relieving_id": rel._id,
    });
    console.log(
      relCreateLog ? "✅ RELIEVE_CREATE found" : "❌ RELIEVE_CREATE missing",
    );

    // 7. Relieving Final
    await updateRelieving(rel._id, { status: "Relieved" }, ctx);
    const relievedLog = await AuditLog.findOne({
      action: "RELIEVED",
      "metadata.relieving_id": rel._id,
    });
    console.log(relievedLog ? "✅ RELIEVED found" : "❌ RELIEVED missing");

    // Cleanup
    await mongoose.connection.db
      .collection("leaves")
      .deleteOne({ _id: leave._id });
    await mongoose.connection.db
      .collection("movements")
      .deleteOne({ _id: move._id });
    await mongoose.connection.db
      .collection("relievings")
      .deleteOne({ _id: rel._id });
  });

  await mongoose.disconnect();
}

test();
