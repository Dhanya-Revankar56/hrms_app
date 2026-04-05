const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

// 🛡 Load Environment First
const envPath = path.join(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const Tenant = require(path.join(__dirname, "../src/modules/tenant/model"));
const User = require(path.join(__dirname, "../src/modules/auth/user.model"));
const Employee = require(path.join(__dirname, "../src/modules/employee/model"));
const AuditLog = require(path.join(__dirname, "../src/modules/audit/model"));

/**
 * 🏰 ENTERPRISE HARDENED MIGRATION SCRIPT v3
 */
async function migrate() {
  console.log("🚀 Starting hardened migration...");
  console.log(`📂 Env path: ${envPath}`);
  
  const results = {
    tenantsCreated: 0,
    usersCreated: 0,
    employeesUpdated: 0,
    errors: [],
    conflicts: []
  };

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file.");
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected successfully.");

    // 1. Resolve Institutions
    const institutionCodes = await Employee.distinct("institution_id").setOptions({ skipTenant: true });
    console.log(`🔍 Found ${institutionCodes.length} institutions: ${institutionCodes.join(", ")}`);

    const tenantMap = {};
    for (const code of institutionCodes) {
      if (!code) continue;
      const upperCode = code.toUpperCase();
      
      let tenant = await Tenant.findOne({ code: upperCode }).setOptions({ skipTenant: true });
      if (!tenant) {
        tenant = await Tenant.create({
          name: `Institution ${upperCode}`,
          code: upperCode,
          isActive: true
        });
        results.tenantsCreated++;
        console.log(`[TENANT] Created: ${upperCode}`);
      }
      tenantMap[code] = tenant._id;
    }

    // 2. Process Employees
    const employees = await Employee.find({}).setOptions({ skipTenant: true });
    console.log(`🔍 Processing ${employees.length} employee records...`);

    for (const emp of employees) {
      const tId = tenantMap[emp.institution_id];
      if (!tId) {
        results.errors.push(`Employee ${emp.employee_id || emp._id} has NO valid institution_id`);
        continue;
      }

      // Find Existing User or Create New
      const existingUser = await User.findOne({ 
        email: emp.user_email ? emp.user_email.toLowerCase() : "unknown@example.com", 
        tenant_id: tId 
      }).setOptions({ skipTenant: true });
      
      let userId;
      if (existingUser) {
        userId = existingUser._id;
      } else {
        try {
          const newUser = new User({
            email: (emp.user_email || `user_${emp.employee_id || emp._id}@temp.com`).toLowerCase(),
            password: emp.password || "$2b$10$temporarypasswordhashplaceholder", // fallback if somehow missing
            role: (emp.app_role || "EMPLOYEE").toUpperCase(),
            tenant_id: tId
          });
          
          await newUser.save();
          userId = newUser._id;
          results.usersCreated++;
        } catch (uErr) {
          results.errors.push(`USER_CREATE_FAILED: ${emp.user_email} -> ${uErr.message}`);
          continue;
        }
      }

      // Update Employee
      await Employee.updateOne(
        { _id: emp._id },
        { 
          $set: { 
            tenant_id: tId, 
            user_id: userId, 
            name: emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
            status: emp.app_status || emp.status || "active"
          } 
        },
        { skipTenant: true }
      );
      results.employeesUpdated++;

      // Audit
      await AuditLog.create({
        action: "MIGRATION_V3_LINK",
        user_id: userId,
        tenant_id: tId,
        metadata: { emp_id: emp.employee_id }
      });
    }

    console.log("\n✨ Migration Logic Finished.");
  } catch (err) {
    console.error("❌ MIGRATION ERROR:", err.message);
    console.error(err.stack);
  } finally {
    console.log("\n================ REPORT ================");
    console.log(`Tenants : ${results.tenantsCreated}`);
    console.log(`Users   : ${results.usersCreated}`);
    console.log(`Employees: ${results.employeesUpdated}`);
    console.log(`Errors   : ${results.errors.length}`);
    if (results.errors.length > 0) results.errors.forEach(e => console.log(`!! ${e}`));
    console.log("========================================\n");
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
