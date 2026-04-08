require("dotenv").config({ path: "backend/.env" });
const mongoose = require("mongoose");

async function diagnosePasswords() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const EmployeeSchema = new mongoose.Schema({ user_email: String, password: String, institution_id: String }, { strict: false });
  const UserSchema = new mongoose.Schema({ email: String, password: String, tenant_id: mongoose.Schema.Types.ObjectId }, { strict: false });

  const Employee = mongoose.model("Employee", EmployeeSchema);
  const User = mongoose.model("User", UserSchema);

  const employees = await Employee.find({ password: { $exists: true } }).limit(5);
  console.log("\n🧪 EMPLOYEE PASSWORD SAMPLES (Original Hashed?):");
  employees.forEach(e => console.log(`- Email: ${e.user_email} | Pass: ${e.password ? e.password.substring(0, 10) + "..." : "NULL"}`));

  const users = await User.find().limit(5);
  console.log("\n🧪 USER PASSWORD SAMPLES (Likely Double Hashed?):");
  for (const u of users) {
    console.log(`- Email: ${u.email} | Pass: ${u.password ? u.password.substring(0, 10) + "..." : "NULL"}`);
  }

  process.exit(0);
}

diagnosePasswords().catch(err => {
  console.error("❌ Diagnostic Failed:", err);
  process.exit(1);
});
