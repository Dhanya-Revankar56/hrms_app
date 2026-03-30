require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('./src/modules/eventLog/model');
const connectDB = require('./src/config/db');

async function fixHistoricalLogs() {
  await connectDB();
  const res = await EventLog.updateMany(
    { action_type: 'EMPLOYEE_RELIEVED' }, 
    { $set: { action_type: 'RELIEVED' } }
  );
  console.log(`Updated ${res.modifiedCount} logs to RELIEVED.`);
  process.exit(0);
}
fixHistoricalLogs();
