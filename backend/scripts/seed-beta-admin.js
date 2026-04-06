const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./.env" });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model("User", UserSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const betaTenantId = "69cf9ab6ba557bc5c95ede89";
  const email = "admin_beta@gmail.com";
  const password = "password123";

  // Check if exists
  const existing = await User.findOne({ email, tenant_id: betaTenantId });
  if (existing) {
    console.log("Admin for Beta already exists.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    password: hashedPassword,
    role: "ADMIN",
    tenant_id: new mongoose.Types.ObjectId(betaTenantId),
    isActive: true
  });

  await newUser.save();
  console.log(`Successfully created Admin for College Beta:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
