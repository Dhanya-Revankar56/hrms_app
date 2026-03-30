require('dotenv').config();
const mongoose = require('mongoose');
const Relieving = require('./src/modules/relieving/model');
const Employee = require('./src/modules/employee/model');
const connectDB = require('./src/config/db');

async function cleanSneha() {
  try {
    await connectDB();
    console.log("Connected to DB.");

    // Find Employee named sneha
    const employees = await Employee.find({ first_name: { $regex: /sneha/i } });
    if (employees.length === 0) {
      console.log("No employee named sneha found.");
      process.exit(0);
    }
    
    for (const emp of employees) {
      console.log(`Found Sneha: ${emp._id} - ${emp.first_name} ${emp.last_name}`);
      // Find relieving records for this employee
      const relievings = await Relieving.find({ employee_id: emp._id }).sort({ created_at: 1 });
      
      console.log(`Found ${relievings.length} relieving records for Sneha.`);
      if (relievings.length > 1) {
        const toDelete = relievings[0]; // The first one (oldest)
        console.log(`Deleting oldest relieving record with ID: ${toDelete._id}`);
        await Relieving.findByIdAndDelete(toDelete._id);
        console.log("Deleted successfully.");
      } else {
        console.log("Sneha doesn't have 2 relieving records.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

cleanSneha();
