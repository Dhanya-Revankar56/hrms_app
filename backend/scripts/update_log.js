require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('./src/modules/eventLog/model');
const connectDB = require('./src/config/db');

async function fixAction() {
  await connectDB();
  await EventLog.updateMany(
    { module_name: 'relieving', "new_data.status": "Relieved" },
    { $set: { action_type: 'RELIEVED' } }
  );
  console.log("Updated action type to RELIEVED.");
  process.exit(0);
}
fixAction();
