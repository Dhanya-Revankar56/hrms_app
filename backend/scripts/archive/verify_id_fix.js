const mongoose = require("mongoose");
require("dotenv").config();
const { applyLeave } = require("./src/modules/leave/service");
const { createMovement } = require("./src/modules/movement/service");
const Employee = require("./src/modules/employee/model");
const User = require("./src/modules/auth/user.model");
const { getTenantId } = require("./src/middleware/tenantContext");

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  // 1. Find a real employee and their user_id
  const emp = await Employee.findOne().populate("tenant_id").lean();
  if (!emp) {
    console.log("No employee found for test");
    process.exit(0);
  }

  console.log(
    `Testing with Employee: ${emp.name}, _id: ${emp._id}, user_id: ${emp.user_id}`,
  );

  // Mock context
  const ctx = {
    user: { id: emp.user_id, role: "EMPLOYEE" },
    tenant_id: emp.tenant_id,
  };

  // 2. Test Apply Leave with user_id instead of employee _id
  try {
    console.log("\n--- Testing Apply Leave ---");
    // Using user_id as employee_id
    const leaveInput = {
      employee_id: emp.user_id.toString(),
      leave_type: "Casual Leave",
      from_date: "2027-01-01",
      to_date: "2027-01-02",
    };
    const result = await applyLeave(leaveInput, ctx);
    console.log("✅ Leave Applied! Resolved Employee ID:", result.employee_id);

    // Cleanup
    await mongoose.connection.db
      .collection("leaves")
      .deleteOne({ _id: result._id });
    console.log("Cleaned up leave");
  } catch (err) {
    console.error("❌ Leave Test Failed:", err.message);
  }

  // 3. Test Create Movement with user_id
  try {
    console.log("\n--- Testing Create Movement ---");
    const moveInput = {
      employee_id: emp.user_id.toString(),
      movement_date: "2027-01-05",
      movement_type: "official",
      out_time: "09:00",
      in_time: "10:00",
      purpose: "Verification Test",
    };
    const result = await createMovement(moveInput, ctx);
    console.log(
      "✅ Movement Applied! Resolved Employee ID:",
      result.employee_id,
    );

    // Cleanup
    await mongoose.connection.db
      .collection("movements")
      .deleteOne({ _id: result._id });
    console.log("Cleaned up movement");
  } catch (err) {
    console.error("❌ Movement Test Failed:", err.message);
  }

  await mongoose.disconnect();
}

test();
