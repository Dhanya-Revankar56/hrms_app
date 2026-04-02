const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Employee = require("../src/modules/employee/model");

async function setPassword() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: node scripts/set_user_password.js <email> <password>");
    process.exit(1);
  }

  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);

    const user = await Employee.findOne({ user_email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.first_name} ${user.last_name}`);
    
    // Set the plain password — the Mongoose model's pre-save hook will hash it
    user.password = password;
    await user.save();

    console.log(`✅ Password successfully updated for: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error updating password: ${error.message}`);
    process.exit(1);
  }
}

setPassword();
