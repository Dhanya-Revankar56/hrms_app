require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const EventLog = require('./src/modules/eventLog/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function restore() {
  await connectDB();

  // Recreate test 1 Relieving record
  const emp = await Employee.findById('69ca023a8623377a7b0b99ab').lean();
  let relId = null;

  if (emp) {
      // Create Relieving record exactly as it was
      const rec = new Relieving({
         institution_id: emp.institution_id,
         employee_id: emp._id,
         employee_code: emp.employee_id,
         resignation_date: new Date(),
         last_working_date: new Date(),
         reason: "Better Opportunity",
         status: "Relieved"
      });
      await rec.save();
      relId = rec._id;
      console.log('Restored test 1 Relieving record with ID: ' + rec._id);

      // Now update the specific EventLog that was created for Sneha
      // The event log describes the "relieving" action that was backfilled
      // Change the description and old_data/new_data to test 1.
      await EventLog.updateMany(
         { module_name: 'relieving', action_type: 'RELIEVED' }, // the backfilled one
         { 
           $set: { 
             description: `Employee ${emp.first_name} ${emp.last_name || ""} was relieved. Reason: Better Opportunity`,
             "new_data.employee_id": emp._id,
             "new_data._id": relId
           } 
         }
      );
      console.log('Fixed EventLog description to point to test 1.');
  }

  process.exit(0);
}
restore();
