require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("../src/modules/employee/model");

/**
 * Multi-Tenancy Migration Helper
 * Detects duplicate emails that exist across DIFFERENT institutions.
 * These will now be allowed by the compound index, but the script 
 * also checks for duplicates within the SAME institution which must be fixed.
 */
async function detectDuplicates() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected.");

    console.log("\n--- Checking for Global Email Duplicates ---");
    const emailDuplicates = await Employee.aggregate([
      {
        $group: {
          _id: "$user_email",
          count: { $sum: 1 },
          institutions: { $addToSet: "$institution_id" },
          ids: { $addToSet: "$_id" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (emailDuplicates.length === 0) {
      console.log("✅ No duplicate emails found across the database.");
    } else {
      console.log(`⚠️ Found ${emailDuplicates.length} emails used multiple times:`);
      emailDuplicates.forEach(dup => {
        const isCrossTenant = dup.institutions.length > 1;
        console.log(`  - Email: ${dup._id}`);
        console.log(`    Count: ${dup.count}`);
        console.log(`    Institutions: ${dup.institutions.join(", ")}`);
        console.log(`    Type: ${isCrossTenant ? "CROSS-TENANT (Will be allowed)" : "SAME-TENANT (MUST BE FIXED manually)"}`);
        console.log("    ---");
      });
    }

    console.log("\n--- Checking for Global Employee ID Duplicates ---");
    const idDuplicates = await Employee.aggregate([
      {
        $group: {
          _id: "$employee_id",
          count: { $sum: 1 },
          institutions: { $addToSet: "$institution_id" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (idDuplicates.length === 0) {
      console.log("✅ No duplicate Employee IDs found.");
    } else {
      console.log(`⚠️ Found ${idDuplicates.length} Employee IDs used multiple times:`);
      idDuplicates.forEach(dup => {
        const isCrossTenant = dup.institutions.length > 1;
        console.log(`  - ID: ${dup._id}`);
        console.log(`    Count: ${dup.count}`);
        console.log(`    Institutions: ${dup.institutions.join(", ")}`);
        console.log(`    Type: ${isCrossTenant ? "CROSS-TENANT (Will be allowed)" : "SAME-TENANT (MUST BE FIXED manually)"}`);
        console.log("    ---");
      });
    }

    console.log("\n🎉 Audit complete.");
  } catch (err) {
    console.error("❌ Audit failed:", err);
  } finally {
    await mongoose.connection.close();
  }
}

detectDuplicates();
