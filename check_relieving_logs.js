const mongoose = require('mongoose');
require('dotenv').config();

// Define Schema locally for the script
const eventLogSchema = new mongoose.Schema({
  action_type: String,
  module_name: String,
  description: String,
  timestamp: Date,
  new_data: Object
}, { collection: 'eventlogs' });

async function checkLogs() {
  await mongoose.connect('mongodb://localhost:27017/hrms'); // Adjust if different
  const EventLog = mongoose.model('EventLog', eventLogSchema);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const logs = await EventLog.find({ 
    timestamp: { $gte: today },
    module_name: 'relieving'
  }).sort({ timestamp: -1 });
  
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}

checkLogs().catch(err => {
  console.error(err);
  process.exit(1);
});
