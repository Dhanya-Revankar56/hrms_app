require("dotenv").config({ path: "c:/projects/hrms_app/backend/.env" });
const mongoose = require("mongoose");
const User = require("./src/modules/auth/user.model");

async function seedUser() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const email = "dhanyavernekar@gmail.com";
  const password = "Dhanya2026";
  const tenant_id = "69cf9ab6ba557bc5c95ede7c"; // COLLEGE_A

  // 1. Find or Create User
  let user = await User.findOne({ email }).setOptions({ skipTenant: true });

  if (user) {
    console.log("User exists. Updating password and unlocking...");
    user.password = password;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.isActive = true;
    await user.save();
  } else {
    console.log("Creating new user...");
    user = new User({
      email,
      password,
      name: "Dhanya Vernekar",
      role: "admin",
      tenant_id,
      isActive: true,
    });
    await user.save();
  }

  console.log("✅ User seeded/updated successfully!");
  process.exit(0);
}

seedUser().catch((err) => {
  console.error("Error seeding user:", err);
  process.exit(1);
});
