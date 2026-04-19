const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Tenant = require("../src/modules/tenant/model");

// Models to migrate
const MODELS = [
  { name: "User", path: "../src/modules/auth/user.model" },
  { name: "Employee", path: "../src/modules/employee/model" },
  { name: "MovementRegister", path: "../src/modules/movement/model" },
  { name: "Leave", path: "../src/modules/leave/model" },
  { name: "Attendance", path: "../src/modules/attendance/model" },
  { name: "Relieving", path: "../src/modules/relieving/model" },
];

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const tenants = await Tenant.find({});
    const tenantMap = new Map();
    tenants.forEach((t) => {
      tenantMap.set(t.code.toUpperCase(), { id: t._id, code: t.code });
      // Map it to its ID as well for migration of legacy institution_id strings
      tenantMap.set(t._id.toString(), { id: t._id, code: t.code });
    });

    console.log(`🏰 Loaded ${tenants.length} tenants for scoping.`);

    for (const modelInfo of MODELS) {
      console.log(`\n📦 Migrating ${modelInfo.name}...`);
      const Model = require(modelInfo.path);

      // Find records with missing tenant_id OR missing tenant_code (if applicable to the model)
      // Perform a FULL scan for MovementRegister and Employee to ensure ID consistency
      const query =
        modelInfo.name === "MovementRegister" || modelInfo.name === "Employee"
          ? {}
          : {
              $or: [
                { tenant_id: { $exists: false } },
                { tenant_id: null },
                ...(modelInfo.name === "User"
                  ? [{ tenant_code: { $exists: false } }]
                  : []),
              ],
            };

      const records = await Model.find(query)
        .setOptions({ skipTenant: true })
        .lean();
      console.log(`🔍 Found ${records.length} records needing scoping.`);

      for (const rec of records) {
        const update = {};

        // 1. Resolve Tenant
        let targetTenant = null;
        const lookup = rec.institution_id || rec.tenant_id?.toString();
        if (lookup && tenantMap.has(lookup.toUpperCase())) {
          targetTenant = tenantMap.get(lookup.toUpperCase());
        } else if (lookup && tenantMap.has(lookup)) {
          targetTenant = tenantMap.get(lookup);
        } else {
          targetTenant = tenantMap.get("COLLEGE_A");
        }

        if (targetTenant) {
          update.tenant_id = targetTenant.id;
          if (modelInfo.name === "User") update.tenant_code = targetTenant.code;
        }

        // 2. Resolve Employee/User cross-links (Safe Casting)
        if (rec.employee_id && typeof rec.employee_id === "string") {
          try {
            update.employee_id = new mongoose.Types.ObjectId(rec.employee_id);
          } catch {
            /* ignore cast errors */
          }
        }
        if (rec.user_id && typeof rec.user_id === "string") {
          try {
            update.user_id = new mongoose.Types.ObjectId(rec.user_id);
          } catch {
            /* ignore cast errors */
          }
        }

        if (Object.keys(update).length > 0) {
          await Model.updateOne(
            { _id: rec._id },
            { $set: update },
            { skipTenant: true },
          );
        }
      }
      console.log(`✅ ${modelInfo.name} migration finished.`);
    }

    console.log("\n✨ GLOBAL SCOPING COMPLETE.");
  } catch (err) {
    console.error("❌ GLOBAL SCOPING FAILED:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
