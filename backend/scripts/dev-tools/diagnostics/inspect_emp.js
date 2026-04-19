const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Employee = require("../../src/modules/employee/model");
    const emp = await Employee.findOne();
    if (emp) {
      console.log("--- EMPLOYEE RECORD ---");
      console.log(JSON.stringify(emp, null, 2));
    } else {
      console.log("No employees found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
