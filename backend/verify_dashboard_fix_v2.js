const mongoose = require('mongoose');
require('dotenv').config();
const { resolvers } = require('./src/modules');
const Employee = require('./src/modules/employee/model');
const { runWithTenant } = require('./src/middleware/tenantContext');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const Tenant = require('./src/modules/tenant/model');
  const tenant = await Tenant.findOne();
  if (!tenant) { process.exit(0); }

  await runWithTenant({ tenantId: tenant._id }, async () => {
    
    // 1. Get an HOD for testing
    const HOD_EMAIL = 'neha.joshi@gmail.com'; 
    const User = require('./src/modules/auth/user.model');
    const user = await User.findOne({ email: HOD_EMAIL }).lean();
    if (!user) { console.log('HOD Not found'); return; }

    const emp = await Employee.findOne({ user_id: user._id }).lean();
    if (!emp) { console.log('Emp not found for user'); return; }
    const deptId = emp.work_detail.department.toString();

    console.log(`Testing with HOD: ${user.email}, Role: ${user.role}, Dept: ${deptId}`);

    const ctx = { user: { id: user._id.toString(), role: user.role, tenant_id: tenant._id } };

    // TEST 1: dashboardStats Resolver
    const stats = await resolvers.Query.dashboardStats(null, {}, ctx);
    console.log(`\nDashboard Card - Total Employees: ${stats.totalEmployees}`);
    
    // Count manually
    const manualCount = await Employee.countDocuments({ 
        'work_detail.department': deptId, 
        is_active: true, 
        tenant_id: tenant._id 
    });
    console.log(`Manual Dept Count: ${manualCount}`);
    
    if (stats.totalEmployees === manualCount) {
        console.log('✅ dashboardStats card scoping OK');
    } else {
        console.log('❌ dashboardStats card scoping WRONG');
    }

    // TEST 2: getAllEmployees Resolver (Recent Joinees)
    const emps = await resolvers.Query.getAllEmployees(null, {}, ctx);
    console.log(`\nRecent Joinees Scoped Count: ${emps.items.length}`);
    
    const allSameDept = emps.items.every(item => item.work_detail.department.toString() === deptId);
    if (allSameDept) {
        console.log('✅ getAllEmployees list scoping OK');
    } else {
        console.log('❌ getAllEmployees list scoping WRONG');
    }
  });

  await mongoose.disconnect();
}

test();
