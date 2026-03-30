require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const EventLog = require('./src/modules/eventLog/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function cleanup() {
  await connectDB();
  
  // 1. Restore Sneha P to active status
  const sneha = await Employee.findById('69c0db719afd04be05f6dd62');
  if (sneha) {
    sneha.app_status = 'active';
    sneha.is_active = true;
    sneha.relieved_at = undefined;
    sneha.relieved_reason = undefined;
    await sneha.save();
    console.log("Restored Sneha P to active status.");
  }

  // 2. Delete Sneha P's relieving record
  const res = await Relieving.deleteOne({ _id: '69c8c7d201be3dc4e83c2e03' });
  if (res.deletedCount > 0) {
    console.log("Deleted Sneha P's relieving record.");
  }

  // 3. Ensure test 1 is the one marked in the EventLog
  // (We already did this, but let's double check it points to test 1)
  const log = await EventLog.findOne({ module_name: 'relieving', action_type: 'RELIEVED' });
  if (log) {
    console.log("Current EventLog Description: " + log.description);
  }

  process.exit(0);
}
cleanup();
