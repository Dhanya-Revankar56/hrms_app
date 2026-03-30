const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function backfill() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const eventLogSchema = new mongoose.Schema({
      institution_id: String,
      user_id: String,
      user_name: String,
      user_role: String,
      action_type: String,
      module_name: String,
      record_id: String,
      description: String,
      timestamp: Date,
      new_data: mongoose.Schema.Types.Mixed
    }, { collection: 'eventlogs' });

    const EventLog = mongoose.model('EventLog', eventLogSchema);

    const relievingSchema = new mongoose.Schema({
      institution_id: String,
      employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      status: String,
      reason: String,
      updated_at: Date
    }, { collection: 'relievings' });

    const Relieving = mongoose.model('Relieving', relievingSchema);

    const employeeSchema = new mongoose.Schema({
      first_name: String,
      last_name: String
    }, { collection: 'employees' });

    const Employee = mongoose.model('Employee', employeeSchema);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Find all records that were relieved today
    const records = await Relieving.find({ 
      status: "Relieved",
      updated_at: { $gte: today }
    });

    console.log(`Found ${records.length} relieved records today.`);

    for (const r of records) {
       // Check if a RELIEVED log already exists for this record_id
       const existing = await EventLog.findOne({ 
         record_id: r._id.toString(),
         action_type: "RELIEVED"
       });

       if (!existing) {
          console.log(`Backfilling log for record: ${r._id}`);
          
          const emp = await Employee.findById(r.employee_id);
          const name = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee";

          const newLog = new EventLog({
            institution_id: r.institution_id,
            user_id: "System",
            user_name: "Admin",
            user_role: "Admin",
            action_type: "RELIEVED",
            module_name: "relieving",
            record_id: r._id.toString(),
            description: `${name} was relieved. Reason: ${r.reason || "Not specified"}`,
            timestamp: r.updated_at,
            new_data: r.toObject()
          });

          await newLog.save();
          console.log(`Saved RELIEVED log for ${name}`);
       } else {
          console.log(`Log already exists for record: ${r._id}`);
       }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

backfill();
