/**
 * 🛠 HRMS Admin Password Setup Script
 * Use this to set the initial password for an admin user.
 * 
 * Usage: node scripts/set_admin_password.js <email> <password>
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("../src/modules/employee/model");
const connectDB = require("../src/config/db");

async function setPassword() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("❌ Usage: node scripts/set_admin_password.js <email> <password>");
    process.exit(1);
  }

  try {
    await connectDB();
    
    const user = await Employee.findOne({ user_email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    user.password = password;
    // Ensure role is admin if not already
    if (user.app_role !== 'admin') {
      user.app_role = 'admin';
    }
    
    await user.save();
    
    console.log(`✅ Password successfully updated for ${user.first_name} ${user.last_name} (${email})`);
    console.log(`🛡 Role ensured as: ${user.app_role}`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    process.exit(1);
  }
}

setPassword();
