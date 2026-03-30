require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function checkRelievings() {
  try {
    await connectDB();
    console.log("Connected to DB.");

    const rels = await Relieving.find().populate('employee_id');
    console.log(`Total Relievings: ${rels.length}`);
    
    for (const r of rels) {
      if (r.employee_id && r.employee_id.first_name) {
         console.log(`RelievingID: ${r._id} | Employee: ${r.employee_id.first_name} ${r.employee_id.last_name}`);
      } else {
         console.log(`RelievingID: ${r._id} | Employee matches empty/null.`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkRelievings();
