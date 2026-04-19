require("dotenv").config();

// Load models
const AuditLog = require("./src/modules/audit/model");
const Relieving = require("./src/modules/relieving/model");
const connectDB = require("./src/config/db");

async function backfillFuzzy() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ Connected.");

    const relievings = await Relieving.find({ status: "Relieved" })
      .setOptions({ skipTenant: true })
      .populate("employee_id")
      .lean();
    console.log(`Found ${relievings.length} Relieved records to check.`);

    for (const rec of relievings) {
      const empName = rec.employee_id?.name || "Employee";
      console.log(`\nChecking Fuzzy Logs for ${empName} (ID: ${rec._id})...`);

      // Look for logs by description matching the name and "relieved"
      const log = await AuditLog.findOne({
        module: "Relieving",
        "metadata.description": new RegExp(empName, "i"),
      })
        .setOptions({ skipTenant: true })
        .sort({ timestamp: -1 })
        .populate("user_id")
        .lean();

      if (log) {
        console.log(
          `  Found log: "${log.metadata.description}" by User: ${log.user_id?.email || log.user_id}`,
        );

        const updateData = {
          approved_by: {
            user_name: log.user_id?.first_name
              ? `${log.user_id.first_name} ${log.user_id.last_name || ""}`
              : log.user_id?.email || "Admin",
            user_role: log.user_id?.role || "ADMIN",
          },
          approved_at: log.timestamp,
          remarks:
            log.metadata?.remarks ||
            rec.remarks ||
            "Auto-detected from Audit Trail",
        };

        await Relieving.updateOne(
          { _id: rec._id },
          { $set: updateData },
        ).setOptions({ skipTenant: true });
        console.log(`  ✅ Updated with fuzzy info.`);
      } else {
        console.log(`  ❌ No fuzzy match found.`);
      }
    }

    console.log("\n✨ Fuzzy Backfill complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during backfill:", err);
    process.exit(1);
  }
}

backfillFuzzy();
