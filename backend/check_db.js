require("dotenv").config({ path: "c:/projects/hrms_app/backend/.env" });
const mongoose = require("mongoose");
// We need to mock the tenant context or satisfy the plugin
const User = require("./src/modules/auth/user.model");

async function checkUsers() {
  console.log("Connecting to:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // We bypass the tenant plugin using skipTenant
  const users = await User.find({}).setOptions({ skipTenant: true });
  console.log("--- USER LIST ---");
  if (users.length === 0) {
    console.log("No users found in the database!");
  } else {
    users.forEach((u) => {
      console.log(
        `- Email: ${u.email} | TenantID: ${u.tenant_id} | Role: ${u.role}`,
      );
    });
  }

  process.exit(0);
}

checkUsers().catch((err) => {
  console.error("Error checking users:", err);
  process.exit(1);
});
