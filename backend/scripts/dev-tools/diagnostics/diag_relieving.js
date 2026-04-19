require("dotenv").config();
const mongoose = require("mongoose");

async function diagnostic() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await mongoose.connection.db
    .collection("users")
    .findOne({ email: "dhanyavernekar@gmail.com" });
  if (!user) {
    console.log("User dhanyavernekar@gmail.com not found in the database");
    // List some users to see what's available
    const someUsers = await mongoose.connection.db
      .collection("users")
      .find({})
      .limit(5)
      .toArray();
    console.log(
      "Available users:",
      someUsers.map((u) => u.email),
    );
    await mongoose.disconnect();
    return;
  }
  runDiagnostic(user);
}

async function runDiagnostic(user) {
  console.log("User Info:", {
    id: user._id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
  });

  // 1. Find Employee record
  const emp = await mongoose.connection.db
    .collection("employees")
    .findOne({ user_id: user._id });
  console.log(
    "Employee Record:",
    emp
      ? {
          id: emp._id,
          employee_id: emp.employee_id,
          tenant_id: emp.tenant_id,
          dept: emp.work_detail?.department,
        }
      : "NOT FOUND",
  );

  if (emp) {
    // 2. Find Relieving records for this employee
    const relievings = await mongoose.connection.db
      .collection("relievings")
      .find({
        $or: [{ employee_id: emp._id }, { employee_id: emp._id.toString() }],
      })
      .toArray();

    console.log(
      `Relieving Records found for employee (${emp._id}):`,
      relievings.length,
    );
    if (relievings.length > 0) {
      console.log("Sample Relieving Record:", {
        id: relievings[0]._id,
        employee_id: relievings[0].employee_id,
        tenant_id: relievings[0].tenant_id,
        status: relievings[0].status,
      });
    }

    // 3. Find ALL Relieving records for this tenant
    const allRelievings = await mongoose.connection.db
      .collection("relievings")
      .find({
        tenant_id: emp.tenant_id,
      })
      .toArray();
    console.log(
      `Total Relievings for tenant (${emp.tenant_id}):`,
      allRelievings.length,
    );
    if (allRelievings.length > 0) {
      const statuses = [...new Set(allRelievings.map((r) => r.status))];
      console.log("Unique statuses in DB:", statuses);
      console.log("Sample Record Status:", allRelievings[0].status);
    }
  }

  await mongoose.disconnect();
}

diagnostic().catch(console.error);
