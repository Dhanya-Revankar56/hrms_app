const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

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
      new_data: { type: mongoose.Schema.Types.Mixed }
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
      // 1. If status is "Relieved", fix action_type and description
      if (log.new_data && log.new_data.status === "Relieved") {
         console.log(`Fixing Log ID: ${log._id} to RELIEVED`);
         
         log.action_type = "RELIEVED";
         
         // Extract name from description (supports "Employee {Name}" or "for {Name}")
         let name = "Employee";
         if (log.description.includes("Employee ")) {
           name = log.description.split("Employee ")[1].split(" was relieved")[0].split(".")[0].trim(); 
         } else if (log.description.includes("for ")) {
            name = log.description.split("for ")[1].split(".")[0].trim();
         }
         
         const reason = log.new_data.reason || "Not specified";
         log.description = `${name} was relieved. Reason: ${reason}`;
         
         await log.save();
      }
      
      // 2. If it's a CREATE log, fix description to include Reason
      if (log.action_type === "CREATE") {
         console.log(`Fixing Create Log ID: ${log._id}`);
         let name = "Employee";
         if (log.description.includes("Employee ")) {
           name = log.description.split("Employee ")[1].trim();
         } else if (log.description.includes("for ")) {
           name = log.description.split("for ")[1].split(".")[0].trim();
         }
         
         const reason = log.new_data?.reason || "Not specified";
         log.description = `Exit request created for ${name}. Reason: ${reason}`;
         await log.save();
      }
    }

    console.log("Data repair finished.");
    process.exit(0);
  } catch (err) {
    console.error("Error during repair:", err);
    process.exit(1);
  }
}

fixAudit();
