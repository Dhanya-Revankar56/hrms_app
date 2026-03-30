require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('./src/modules/eventLog/model');
const connectDB = require('./src/config/db');

async function checkLogs() {
  await connectDB();
  const logs = await EventLog.find({ module_name: 'relieving' }).sort({ timestamp: -1 });
  console.log('--- RELIEVING LOGS ---');
  logs.forEach(l => {
    console.log(`${l.timestamp.toISOString()} | ID: ${l._id} | Action: ${l.action_type} | Description: ${l.description}`);
  });
  process.exit(0);
}
checkLogs();
