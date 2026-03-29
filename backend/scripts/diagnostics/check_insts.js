const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Department = require('../../src/modules/settings/department.model');
    const insts = await Department.distinct("institution_id");
    console.log("--- INSTITUTION IDs in Department ---");
    console.log(JSON.stringify(insts, null, 2));
    
    const count = await Department.countDocuments();
    console.log("Total Departments:", count);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
