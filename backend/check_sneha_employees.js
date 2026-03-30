require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function checkSneha() {
  try {
    await connectDB();
    console.log("Connected to DB.");

    const snehas = await Employee.find({ first_name: { $regex: /^sneha/i } }).sort({ created_at: 1 });
    console.log(`Total Snehas: ${snehas.length}`);
    
    for (const s of snehas) {
       console.log(`EmployeeID: ${s._id} | Name: ${s.first_name} ${s.last_name} | EmpID: ${s.employee_id} | Created: ${s.created_at || s._id.getTimestamp()}`);
    }

    if (snehas.length > 1) {
       console.log(`Deleting oldest Sneha: ${snehas[0]._id}`);
       await Employee.findByIdAndDelete(snehas[0]._id);
       console.log("Deleted.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSneha();
