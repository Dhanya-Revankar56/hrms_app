const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const EventLog = require("../src/modules/eventLog/model");

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const total = await EventLog.countDocuments();
    console.log(`Total EventLogs: ${total}`);

    if (total > 0) {
      const sample = await EventLog.findOne();
      console.log("Sample EventLog:", JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLogs();
