const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function fixAudit() {
  try {
    if (!process.env.MONGO_URI) {
       console.error("MONGO_URI not found in .env");
       process.exit(1);
    }
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
    
    // Find relieving logs from today (March 30th)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const logs = await EventLog.find({ 
      timestamp: { $gte: today },
      module_name: 'relieving'
    });

    console.log(`Inspecting ${logs.length} relieving logs...`);

    for (const log of logs) {
      if (log.new_data && log.new_data.status === "Relieved") {
         console.log(`Fixing Log ID: ${log._id} from ${log.action_type || 'NONE'} to RELIEVED`);
         
         // Fix type
         log.action_type = "RELIEVED";
         
         // Fix Description format: {Name} was relieved. Reason: {Reason}
         // Try to find the name if possible, or use existing name
         let name = "Employee";
         if (log.description.includes("Employee ")) {
           name = log.description.split("Employee ")[1].split(" was relieved")[0].split(" (")[0]; 
         } else if (log.description.includes("Exit request updated for ")) {
            name = log.description.split("for ")[1];
         }
         
         // Special case: Sneha P or test 1
         if (log.description.includes("Sneha P")) name = "Sneha P";
         if (log.description.includes("test 1")) name = "test 1";

         const reason = log.new_data.reason || "Not specified";
         log.description = `${name} was relieved. Reason: ${reason}`;
         
         await log.save();
      }
    }

    console.log("Finished fixing today's relieving logs.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixAudit();
