require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('./src/modules/eventLog/model');
const connectDB = require('./src/config/db');

async function checkDateLogs() {
  await connectDB();
  const logs = await EventLog.find({ 
    timestamp: { 
      $gte: new Date('2026-03-29T00:00:00.000Z'), 
      $lte: new Date('2026-03-29T23:59:59.999Z') 
    }
  }).sort({ timestamp: -1 });
  
  console.log('--- LOGS FOR 29th MARCH ---');
  logs.forEach(l => {
    console.log(`${l.timestamp.toISOString()} | Module: ${l.module_name} | Action: ${l.action_type} | Description: ${l.description}`);
  });
  process.exit(0);
}
checkDateLogs();
