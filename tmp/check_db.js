require("dotenv").config();
const mongoose = require("mongoose");

async function checkDatabase() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const Tenant = mongoose.model("Tenant", new mongoose.Schema({ name: String, code: String }));
  const User = mongoose.model("User", new mongoose.Schema({ email: String, tenant_id: mongoose.Schema.Types.ObjectId, role: String }));

  const tenants = await Tenant.find();
  console.log("\n🏙 TENANTS FOUND:", tenants.length);
  tenants.forEach(t => console.log(`- ${t.name} (${t.code}) [${t._id}]`));

  const users = await User.find().limit(10);
  console.log("\n👤 FIRST 10 USERS FOUND:", users.length);
  users.forEach(u => console.log(`- ${u.email} [TenantID: ${u.tenant_id}] (Role: ${u.role})`));

  process.exit(0);
}

checkDatabase().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
