require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('./src/modules/eventLog/model');
const Relieving = require('./src/modules/relieving/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function fixDesc() {
  await connectDB();
  
  const rel = await Relieving.findById('69c8c7d201be3dc4e83c2e03').lean();
  let empName = "Sneha P";
  if (rel && rel.employee_id) {
     const emp = await Employee.findById(rel.employee_id).lean();
     if (emp) {
        empName = `${emp.first_name} ${emp.last_name || ""}`.trim();
     }
  }

  const actReason = rel?.reason || "Better Opportunity";

  await EventLog.updateMany(
    { module_name: 'relieving', action_type: 'RELIEVED', "new_data.status": "Relieved" },
    { $set: { description: `Employee ${empName} was relieved. Reason: ${actReason}` } }
  );
  console.log("Updated description.");
  process.exit(0);
}
fixDesc();
