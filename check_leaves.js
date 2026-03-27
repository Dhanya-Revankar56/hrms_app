const mongoose = require("mongoose");
const Leave = require("./backend/src/modules/leave/model");
const Employee = require("./backend/src/modules/employee/model");

async function check() {
  await mongoose.connect("mongodb://localhost:27017/hrms");
  const leaves = await Leave.find().populate("employee_id").lean();
  console.log("Total leaves found:", leaves.length);
  leaves.forEach(l => {
    console.log(`Leave ID: ${l._id}, Status: ${l.status}, Emp: ${l.employee_id?.first_name} ${l.employee_id?.last_name}, Dates: ${l.from_date} to ${l.to_date}`);
  });
  mongoose.disconnect();
}

check();
