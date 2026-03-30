const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAllLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const eventLogSchema = new mongoose.Schema({
      action_type: String,
      module_name: String,
      description: String,
      timestamp: Date
    }, { collection: 'eventlogs' });

    const EventLog = mongoose.model('EventLog', eventLogSchema);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Find all logs from today
    const logs = await EventLog.find({ 
      timestamp: { $gte: today }
    }).sort({ timestamp: -1 }).limit(20);

    logs.forEach(l => {
      console.log(`[${l.timestamp.toISOString()}] Module: ${l.module_name}, Action: ${l.action_type}, Desc: ${l.description}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAllLogs();
