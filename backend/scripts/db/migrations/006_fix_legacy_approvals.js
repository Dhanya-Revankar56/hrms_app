const mongoose = require("mongoose");
const MONGO_URI =
  "mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority";

// Use the existing Leave model
const Leave = require("../../src/modules/leave/model");

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Atlas for migration...");

    const result = await Leave.updateMany(
      { $or: [{ approvals: { $exists: false } }, { approvals: { $size: 0 } }] },
      {
        $set: {
          approvals: [
            {
              role: "HOD",
              status: "pending",
              remarks: "Legacy record migrated.",
            },
            {
              role: "ADMIN",
              status: "pending",
              remarks: "Legacy record migrated.",
            },
          ],
        },
      },
    );

    console.log(
      `Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
    );
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
