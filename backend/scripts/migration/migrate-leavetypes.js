const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".../../.env") });

// Model
const LeaveType = require("../src/modules/settings/leaveType.model");

async function migrate() {
  console.log("🚀 Starting LeaveType Migration...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Use updateMany with $rename to handle the name change efficiently
    const result = await LeaveType.updateMany(
      { days: { $exists: true } },
      { 
        $rename: { "days": "total_days" },
        $set: { 
          max_per_request: 0,
          carry_forward: false,
          leave_category: "paid",
          applicable_for: ["Male", "Female", "Other"],
          reset_cycle: "yearly"
        }
      }
    );

    console.log(`✅ Migration Complete! Updated ${result.modifiedCount} documents.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

migrate();
