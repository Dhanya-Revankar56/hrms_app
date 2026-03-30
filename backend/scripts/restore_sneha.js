require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function restoreSneha() {
  await connectDB();
  
  // 1. Mark Sneha P as relieved again
  const sneha = await Employee.findById('69c0db719afd04be05f6dd62');
  if (sneha) {
    sneha.app_status = 'relieved';
    sneha.is_active = false;
    sneha.relieved_at = new Date('2026-03-29T06:33:54.460Z');
    sneha.relieved_reason = 'Better Opportunity';
    await sneha.save();
    console.log("Restored Sneha P employee status to relieved.");
  }

  // 2. Re-create the Relieving record
  // Checking if it already exists first
  const existing = await Relieving.findOne({ employee_id: '69c0db719afd04be05f6dd62' });
  if (!existing) {
    const rec = new Relieving({
      institution_id: sneha.institution_id,
      employee_id: sneha._id,
      employee_code: sneha.employee_id,
      resignation_date: new Date('2026-03-29T00:00:00.000Z'),
      last_working_date: new Date('2026-03-29T00:00:00.000Z'),
      reason: 'Better Opportunity',
      status: 'Relieved'
    });
    await rec.save();
    console.log("Restored Sneha P's relieving record.");
  } else {
    console.log("Relieving record for Sneha P already exists.");
  }

  process.exit(0);
}
restoreSneha();
