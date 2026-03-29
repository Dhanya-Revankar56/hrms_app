const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Employee = require('../../src/modules/employee/model');
    const insts = await Employee.distinct("institution_id");
    console.log("--- INSTITUTION IDs in Employee ---");
    console.log(JSON.stringify(insts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
