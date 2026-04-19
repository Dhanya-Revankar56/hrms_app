const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Leave = require("../../src/modules/leave/model");
    const insts = await Leave.distinct("institution_id");
    console.log("--- INSTITUTION IDs in Leave ---");
    console.log(JSON.stringify(insts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
