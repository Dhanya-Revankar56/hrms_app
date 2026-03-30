const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function fixTodayLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const eventLogSchema = new mongoose.Schema({
      action_type: String,
      module_name: String,
      description: String,
      timestamp: Date,
      new_data: Object
    }, { collection: 'eventlogs' });

    const EventLog = mongoose.model('EventLog', eventLogSchema);
    
    // Find relieving logs from today that might be wrong
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const logsToFix = await EventLog.find({ 
      timestamp: { $gte: today },
      module_name: 'relieving'
    });

    console.log(`Found ${logsToFix.length} relieving logs to inspect.`);

    for (const log of logsToFix) {
      if (log.new_data && log.new_data.status === "Relieved" && log.action_type !== "RELIEVED") {
        console.log(`Fixing Log ID: ${log._id} from ${log.action_type} to RELIEVED`);
        
        // Extract basic info
        const empName = log.description.split('Employee ')[1]?.split(' was relieved')[0] || "Employee";
        const reason = log.new_data.reason || "Not specified";
        
        const newDesc = `${empName} was relieved. Reason: ${reason}`;
        
        log.action_type = "RELIEVED";
        log.description = newDesc;
        await log.save();
      }
    }

    console.log("Fix complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixTodayLogs();
