require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const EventLog = require('./src/modules/eventLog/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function check() {
  await connectDB();
  const rels = await Relieving.find().populate('employee_id');
  console.log('--- RELIEVING RECORDS ---');
  rels.forEach(r => {
    const name = r.employee_id ? `${r.employee_id.first_name} ${r.employee_id.last_name || ""}` : "Unknown";
    console.log(`${r._id} | Employee: ${name} | Status: ${r.status}`);
  });

  const logs = await EventLog.find({ module_name: 'relieving' }).sort({ timestamp: -1 });
  console.log('\n--- EVENT LOGS (Module: relieving) ---');
  logs.forEach(l => {
    console.log(`${l.action_type} | ${l.description}`);
  });
  process.exit(0);
}
check();
