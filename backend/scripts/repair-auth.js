const mongoose = require("mongoose");
const path = require("path");

// 🛡 Load Environment
const envPath = path.join(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const Tenant = require(path.join(__dirname, "../src/modules/tenant/model"));
const User = require(path.join(__dirname, "../src/modules/auth/user.model"));
const Employee = require(path.join(__dirname, "../src/modules/employee/model"));

/**
| 🏰 BOOTSTRAP REPAIR SCRIPT v1
| RECONCILES IDENTITY FRAGMENTATION AND CREDENTIAL CORRUPTION
*/
async function repair() {
  console.log("🚀 Starting Identity Reconciliation...");
  
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing.");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const employees = await Employee.find({}).setOptions({ skipTenant: true });
    console.log(`🔍 Processing ${employees.length} employees...`);

    let repaired = 0;
    let created = 0;
    let errors = 0;

    for (const emp of employees) {
      if (!emp.user_email) {
        console.log(`⚠️ Skip: Employee ${emp.employee_id} has no user_email.`);
        continue;
      }

      const email = emp.user_email.toLowerCase();
      const tenantId = emp.tenant_id;

      if (!tenantId) {
        console.log(`⚠️ Skip: Employee ${emp.employee_id} has no tenant_id.`);
        continue;
      }

      // 1. Find User by Email + Tenant
      let user = await User.findOne({ email, tenant_id: tenantId }).setOptions({ skipTenant: true });

      // 2. If not found, check if it exists under a temp ID (e.g. user_emp-xxx@temp.com)
      if (!user) {
        const tempEmail = `user_${emp.employee_id || emp._id}@temp.com`.toLowerCase();
        user = await User.findOne({ email: tempEmail, tenant_id: tenantId }).setOptions({ skipTenant: true });
        
        if (user) {
           console.log(`📝 Migrating Identity: ${tempEmail} -> ${email}`);
           await User.updateOne({ _id: user._id }, { email }, { skipTenant: true });
        }
      }

      // 3. Fallback: Create User if still missing
      if (!user) {
        console.log(`🆕 Creating missing identity for: ${email}`);
        user = new User({
          email,
          password: emp.password || "$2b$10$temporarypasswordhashplaceholder", // fallback (safety)
          role: (emp.app_role || "EMPLOYEE").toUpperCase(),
          tenant_id: tenantId
        });
        await user.save(); // This will hash it ONCE (if raw) or TWICE (if hashed) - FIX LATER
        created++;
      }

      // 4. RESTORE ORIGINAL HASH (Fix Double-Hashing)
      if (emp.password && emp.password.startsWith("$2b$")) {
        // We use updateOne to bypass the model's 'save' hook (double-hashing trigger)
        await User.updateOne(
           { _id: user._id }, 
           { password: emp.password }, 
           { skipTenant: true }
        );
        repaired++;
      }

      // 5. Relink Employee to User
      await Employee.updateOne({ _id: emp._id }, { user_id: user._id }, { skipTenant: true });
    }

    console.log(`\n✨ REPAIR FINISHED`);
    console.log(`------------------`);
    console.log(`Repaired Credentials : ${repaired}`);
    console.log(`Missing Users Created : ${created}`);
    console.log(`Errors               : ${errors}`);

  } catch (err) {
    console.error("❌ REPAIR FAILED:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

repair();
