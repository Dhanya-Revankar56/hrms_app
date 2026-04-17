require("dotenv").config();

// Load models
const AuditLog = require("./src/modules/audit/model");
const Relieving = require("./src/modules/relieving/model");

const connectDB = require("./src/config/db");

async function backfill() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ Connected.");

    const relievings = await Relieving.find({})
      .setOptions({ skipTenant: true })
      .lean();
    console.log(`Found ${relievings.length} relieving records to check.`);

    for (const rec of relievings) {
      console.log(
        `\nChecking Audit Logs for Employee ${rec.employee_code} (ID: ${rec._id})...`,
      );

      // Look for any log that mentions this record ID in metadata
      // The eventLog service uses 'metadata.relieving_id' or 'metadata.record_id'
      const log = await AuditLog.findOne({
        $or: [
          { "metadata.record_id": rec._id },
          { "metadata.id": rec._id },
          { "metadata.relieving_id": rec._id },
        ],
        action: /RELIEVED|APPROVED/i,
      })
        .setOptions({ skipTenant: true })
        .sort({ timestamp: -1 })
        .populate("user_id")
        .lean();

      if (log) {
        console.log(
          `  Found log: ${log.action} by User: ${log.user_id?.email || log.user_id}`,
        );

        const updateData = {
          approved_by: {
            user_name: log.user_id?.first_name
              ? `${log.user_id.first_name} ${log.user_id.last_name || ""}`
              : log.user_id?.email || "Admin",
            user_role: log.user_id?.role || "ADMIN",
          },
          approved_at: log.timestamp,
        };

        await Relieving.updateOne(
          { _id: rec._id },
          { $set: updateData },
        ).setOptions({ skipTenant: true });
        console.log(`  ✅ Updated Relieving record with audit info.`);
      } else {
        console.log(`  ❌ No approval audit log found.`);
      }
    }

    console.log("\n✨ Backfill complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during backfill:", err);
    process.exit(1);
  }
}

backfill();
