const mongoose = require("mongoose");
const Movement = require("./backend/src/modules/movement/service");
const MovementModel = require("./backend/src/modules/movement/model");
const SettingsModel = require("./backend/src/modules/settings/model");

async function test() {
  await mongoose.connect(
    "mongodb+srv://dhanyap868:p868dhanya@hrms.t9urwje.mongodb.net/hrms?retryWrites=true&w=majority",
  );
  console.log("Connected to MongoDB");

  const instId = "65f1a2b3c4d5e6f7a8b9c0d1"; // Test Institution ID
  const empId = "65f1a2b3c4d5e6f7a8b9c0d2"; // Test Employee ID

  // 1. Setup Settings
  await SettingsModel.findOneAndUpdate(
    { institution_id: instId },
    {
      movement_settings: {
        limit_count: 2,
        limit_frequency: "Weekly",
        max_duration_mins: 60,
        days_before_apply: 3,
        limit_enabled: true,
      },
    },
    { upsert: true },
  );
  console.log(
    "Settings configured: 3 days lead time, 60min duration, 2/week limit.",
  );

  // Clean up existing movements for this test
  await MovementModel.deleteMany({
    institution_id: instId,
    employee_id: empId,
  });

  // 2. Test Lead Time Violation (Applying for today)
  try {
    console.log("\nTesting Lead Time Violation (Today)...");
    await Movement.createMovement({
      institution_id: instId,
      employee_id: empId,
      movement_type: "personal",
      from_location: "Office",
      to_location: "Bank",
      movement_date: new Date(),
      out_time: "10:00",
      in_time: "10:30",
    });
  } catch (e) {
    console.log("Caught expected error:", e.message);
  }

  // 3. Test Duration Violation (120 mins)
  try {
    console.log("\nTesting Duration Violation (120 mins)...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await Movement.createMovement({
      institution_id: instId,
      employee_id: empId,
      movement_type: "personal",
      from_location: "Office",
      to_location: "Bank",
      movement_date: futureDate,
      out_time: "10:00",
      in_time: "12:00",
    });
  } catch (e) {
    console.log("Caught expected error:", e.message);
  }

  // 4. Test Valid Creation and Approval Logic
  console.log("\nTesting Valid Creation and Approval Logic...");
  const validDate = new Date();
  validDate.setDate(validDate.getDate() + 5);
  const mov = await Movement.createMovement({
    institution_id: instId,
    employee_id: empId,
    movement_type: "official",
    from_location: "Office",
    to_location: "Client",
    movement_date: validDate,
    out_time: "14:00",
    in_time: "14:30",
  });
  console.log("Movement created with status:", mov.status);

  // Approve as HOD
  console.log("Approving as HOD...");
  const approvedHOD = await Movement.updateMovement(
    mov._id,
    {
      dept_admin_status: "approved",
      dept_admin_remarks: "HOD approved",
    },
    instId,
  );
  console.log(
    "After HOD Approval: Final Status =",
    approvedHOD.status,
    ", HOD Status =",
    approvedHOD.dept_admin_status,
  );

  // Reject as Admin (Override)
  console.log("Rejecting as Admin...");
  const rejectedAdmin = await Movement.updateMovement(
    mov._id,
    {
      admin_status: "rejected",
      admin_remarks: "Admin overruled",
    },
    instId,
  );
  console.log(
    "After Admin Rejection: Final Status =",
    rejectedAdmin.status,
    ", Admin Status =",
    rejectedAdmin.admin_status,
  );

  // 5. Test Frequency Limit (2 per week)
  console.log("\nTesting Frequency Limit (Limit is 2 per week)...");
  // We have 0 now (rejected doesn't count in checkMovementRules)
  // Let's create 2 valid ones
  await Movement.createMovement({
    institution_id: instId,
    employee_id: empId,
    movement_date: validDate,
    movement_type: "visit",
    from_location: "A",
    to_location: "B",
  });
  await Movement.createMovement({
    institution_id: instId,
    employee_id: empId,
    movement_date: validDate,
    movement_type: "visit",
    from_location: "B",
    to_location: "C",
  });

  try {
    console.log("Attempting 3rd movement in the same week...");
    await Movement.createMovement({
      institution_id: instId,
      employee_id: empId,
      movement_date: validDate,
      movement_type: "visit",
      from_location: "C",
      to_location: "D",
    });
  } catch (e) {
    console.log("Caught expected error:", e.message);
  }

  await mongoose.disconnect();
  console.log("\nTests completed successfully.");
}

test().catch(console.error);
