const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

async function sync() {
  console.log("🚀 Starting Global Tenancy Synchronization...");
  
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing.");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const db = mongoose.connection.db;

    // 1. Identify the ONE TRUE COLLEGE_A
    const tenants = await db.collection('tenants').find({ code: 'COLLEGE_A' }).toArray();
    if (tenants.length === 0) {
      console.log("❌ No COLLEGE_A found! Migration is missing tenants.");
      return;
    }
    
    // Use the FIRST one as the master
    const masterTenant = tenants[0];
    const otherTenantIds = tenants.slice(1).map(t => t._id);
    
    console.log(`🏙 Master COLLEGE_A: ${masterTenant._id}`);
    if (otherTenantIds.length > 0) {
      console.log(`⚠️ Found ${otherTenantIds.length} duplicate(s). Consolidating...`);
    }

    // 2. Synchronize USERS
    const userRes = await db.collection('users').updateMany(
      { $or: [{ tenant_id: { $in: otherTenantIds } }, { email: /dhanya/i }] },
      { $set: { tenant_id: masterTenant._id } }
    );
    console.log(`👤 Users Synchronized: ${userRes.modifiedCount}`);

    // 3. Synchronize EMPLOYEES
    const empRes = await db.collection('employees').updateMany(
      { $or: [{ tenant_id: { $in: otherTenantIds } }, { institution_id: 'COLLEGE_A' }] },
      { $set: { tenant_id: masterTenant._id } }
    );
    console.log(`📄 Employees Synchronized: ${empRes.modifiedCount}`);

    // 4. Clean up duplicate tenants for COLLEGE_A
    if (otherTenantIds.length > 0) {
      const delRes = await db.collection('tenants').deleteMany({ _id: { $in: otherTenantIds } });
      console.log(`🗑 Duplicate Tenants Deleted: ${delRes.deletedCount}`);
    }

    // 5. Final Audit for Dhanya
    const dhanya = await db.collection('users').findOne({ email: 'dhanyavernekar@gmail.com' });
    const employeesInTenantCount = await db.collection('employees').countDocuments({ tenant_id: masterTenant._id });
    
    console.log(`\n✨ SYNC FINISHED`);
    console.log(`----------------`);
    console.log(`Dhanya Tenant    : ${dhanya?.tenant_id}`);
    console.log(`In-Scope Emps    : ${employeesInTenantCount}`);

  } catch (err) {
    console.error("❌ SYNC FAILED:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
sync();
