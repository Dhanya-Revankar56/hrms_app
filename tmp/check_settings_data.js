const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const Department = require("../backend/src/modules/settings/department.model");
const Designation = require("../backend/src/modules/settings/designation.model");
const LeaveType = require("../backend/src/modules/settings/leaveType.model");
const Settings = require("../backend/src/modules/settings/model");

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const settingsCount = await Settings.countDocuments();
    const settings = await Settings.find();
    console.log("Settings Count:", settingsCount);
    console.log("Settings IDs:", settings.map(s => s.institution_id));

    const depts = await Department.countDocuments();
    console.log("Departments Count:", depts);
    const deptSample = await Department.find().limit(5);
    console.log("Dept Sample (IDs):", deptSample.map(d => d.institution_id));

    const desigs = await Designation.countDocuments();
    console.log("Designations Count:", desigs);
    const desigSample = await Designation.find().limit(5);
    console.log("Desig Sample (IDs):", desigSample.map(d => d.institution_id));

    const leaves = await LeaveType.countDocuments();
    console.log("Leave Types Count:", leaves);
    const leaveSample = await LeaveType.find().limit(5);
    console.log("Leave Sample (IDs):", leaveSample.map(l => l.institution_id));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
