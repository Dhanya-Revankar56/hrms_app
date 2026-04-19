const mongoose = require("mongoose");
require("dotenv").config();
const { listEmployees } = require("./src/modules/employee/service");
const { listRelievings } = require("./src/modules/relieving/service");
const Employee = require("./src/modules/employee/model");
const Relieving = require("./src/modules/relieving/model");
const { runWithTenant } = require("./src/middleware/tenantContext");

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const Tenant = require("./src/modules/tenant/model");
  const tenant = await Tenant.findOne();
  if (!tenant) {
    process.exit(0);
  }

  await runWithTenant({ tenantId: tenant._id }, async () => {
    // 1. Get the "Relieved Test" employee (which has is_active: false)
    const emp = await Employee.findOne({
      name: "Relieved Test",
      tenant_id: tenant._id,
    }).lean();
    if (!emp) {
      console.log(
        "Relieved Test record not found. Please create one by relieving an employee first.",
      );
      return;
    }

    console.log(
      `\nTesting visibility for Relieved Employee: ${emp.name} (is_active: ${emp.is_active})`,
    );

    // TEST 1: listEmployees (Employee Management)
    const employeeList = await listEmployees({ pagination: { limit: 100 } });
    const foundInManagement = employeeList.items.find(
      (e) => e._id.toString() === emp._id.toString(),
    );

    if (!foundInManagement) {
      console.log("✅ Relieved employee HIDDEN from Employee Management list");
    } else {
      console.log(
        "❌ Relieved employee still VISIBLE in Employee Management list",
      );
    }

    // TEST 2: listRelievings (Relieving Module)
    const relievingList = await listRelievings({ pagination: { limit: 100 } });
    const foundInRelieving = relievingList.items.find(
      (r) => r.employee_id?._id?.toString() === emp._id.toString(),
    );

    if (foundInRelieving) {
      console.log(
        "✅ Relieved employee data successfully POPULATED in Relieving list",
      );
      console.log(
        `   (Department: ${foundInRelieving.employee_id?.work_detail?.department || "unknown"})`,
      );
    } else {
      console.log("❌ Relieved employee NOT found/populated in Relieving list");
    }
  });

  await mongoose.disconnect();
}

test();
