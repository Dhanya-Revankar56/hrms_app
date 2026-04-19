const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Employee = require("../../src/modules/employee/model");
    const employees = await Employee.find({
      institution_id: "Campus Alpha",
    }).lean();

    let stringDeptCount = 0;
    let stringDesgCount = 0;

    for (const emp of employees) {
      if (emp.work_detail) {
        if (
          emp.work_detail.department &&
          !mongoose.Types.ObjectId.isValid(emp.work_detail.department)
        )
          stringDeptCount++;
        if (
          emp.work_detail.designation &&
          !mongoose.Types.ObjectId.isValid(emp.work_detail.designation)
        )
          stringDesgCount++;
      }
    }

    console.log("--- MIGRATION VERIFICATION ---");
    console.log("Total Employees (Campus Alpha):", employees.length);
    console.log("Remaining String Departments:", stringDeptCount);
    console.log("Remaining String Designations:", stringDesgCount);

    if (employees.length > 0) {
      console.log(
        "Sample Employee:",
        JSON.stringify(employees[0].work_detail, null, 2),
      );
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
