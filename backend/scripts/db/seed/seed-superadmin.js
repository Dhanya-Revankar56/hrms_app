const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./.env" });

const Tenant = require("../src/modules/tenant/model");
const User = require("../src/modules/auth/user.model");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Create SYSTEM Tenant if it doesn't exist
    let systemTenant = await Tenant.findOne({ code: "SYSTEM" });
    if (!systemTenant) {
      systemTenant = new Tenant({
        name: "HRMS Master System",
        code: "SYSTEM",
        isActive: true,
      });
      await systemTenant.save();
      console.log("✅ SYSTEM Tenant created.");
    } else {
      console.log("ℹ️ SYSTEM Tenant already exists.");
    }

    // 2. Create Super Admin User if doesn't exist
    const email = "superadmin@gmail.com";
    const password = "superadmin@123";

    let admin = await User.findOne({ email, tenant_id: systemTenant._id });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin = new User({
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        tenant_id: systemTenant._id,
        isActive: true,
      });
      await admin.save();
      console.log(`✅ Super Admin created: ${email} / ${password}`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${email}`);
    }

    console.log("\n🚀 Super Admin setup complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
