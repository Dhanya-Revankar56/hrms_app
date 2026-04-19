// ⚠️ WARNING: This script deletes employee data. Do NOT run in production.
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

async function resetData() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas");

    // Collections to clear
    const collections = [
      "employees",
      "leaves",
      "attendances",
      "movementregisters",
      "leavebalances",
    ];

    for (const collName of collections) {
      const count = await mongoose.connection
        .collection(collName)
        .countDocuments();
      await mongoose.connection.collection(collName).deleteMany({});
      console.log(`Cleared ${collName} (${count} records deleted)`);
    }

    // Reset counters for employees
    const counterResult = await mongoose.connection
      .collection("counters")
      .deleteMany({ model_name: "employee" });
    console.log(
      `Reset employee ID counters (${counterResult.deletedCount} counter records removed)`,
    );

    console.log(
      "\nSUCCESS: All employee data and related records have been reset.",
    );
    console.log("Next new employee will be assigned EMP-001.");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error during reset:", err);
    process.exit(1);
  }
}

resetData();
