const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/modules/auth/user.model");
const Tenant = require("../src/modules/tenant/model");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const users = await User.find({ tenant_code: { $exists: false } }).setOptions({ skipTenant: true });
    console.log(`🔍 Found ${users.length} users missing tenant_code.`);

    for (const user of users) {
      if (!user.tenant_id) {
        console.log(`⚠️ User ${user.email} has no tenant_id. Skipping.`);
        continue;
      }

      const tenant = await Tenant.findById(user.tenant_id).setOptions({ skipTenant: true });
      if (!tenant) {
        console.log(`❌ Tenant ID ${user.tenant_id} not found for user ${user.email}. Skipping.`);
        continue;
      }

      await User.updateOne({ _id: user._id }, { tenant_code: tenant.code.toUpperCase() }, { skipTenant: true });
      console.log(`✅ Updated User ${user.email} with tenant_code: ${tenant.code}`);
    }

    console.log("✨ Migration complete.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
