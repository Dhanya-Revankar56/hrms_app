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

    console.log(
      `--- WORK DETAIL INSPECTION (${employees.length} employees) ---`,
    );
    employees.forEach((emp) => {
      console.log(
        `Emp: ${emp.first_name} ${emp.last_name} | ID: ${emp.employee_id}`,
      );
      console.log(JSON.stringify(emp.work_detail, null, 2));
    });
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
