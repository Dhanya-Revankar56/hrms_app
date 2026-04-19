const mongoose = require("mongoose");
const MONGO_URI =
  "mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migrate() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected!");

    // 1. Update Users
    console.log("👤 Updating User roles from 'HOD' to 'HEAD OF DEPARTMENT'...");
    const userResult = await mongoose.connection.db
      .collection("users")
      .updateMany({ role: "HOD" }, { $set: { role: "HEAD OF DEPARTMENT" } });
    console.log(`✅ Users Updated: ${userResult.modifiedCount}`);

    // 2. Update Leave Approvals
    // Since approvals is an array, we must use positional update
    console.log(
      "📋 Updating Leave approval roles from 'HOD' to 'HEAD OF DEPARTMENT'...",
    );
    const leaveResult = await mongoose.connection.db
      .collection("leaves")
      .updateMany(
        { "approvals.role": "HOD" },
        { $set: { "approvals.$[elem].role": "HEAD OF DEPARTMENT" } },
        { arrayFilters: [{ "elem.role": "HOD" }] },
      );
    console.log(`✅ Leave Records Updated: ${leaveResult.modifiedCount}`);

    console.log("🎉 Migration Complete!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
