const mongoose = require('mongoose');
require('dotenv').config();
const { getHrAnalytics } = require('./src/modules/analytics/service');
const Employee = require('./src/modules/employee/model');
const { runWithTenant } = require('./src/middleware/tenantContext');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const Tenant = require('./src/modules/tenant/model');
  const tenant = await Tenant.findOne();
  if (!tenant) { process.exit(0); }

  await runWithTenant({ tenantId: tenant._id }, async () => {
    
    // 1. Get an Employee record for testing (they belong to a department)
    const emp = await Employee.findOne({ 'work_detail.department': { $exists: true } }).lean();
    if (!emp) {
      console.log('No employee with department found for test');
      return;
    }

    const deptId = emp.work_detail.department.toString();
    console.log(`Testing with Emp: ${emp.name}, Dept: ${deptId}, user_id: ${emp.user_id}`);

    // Count employees in this department manually for verification
    const expectedCount = await Employee.countDocuments({ 'work_detail.department': deptId, is_active: { $ne: false }, tenant_id: tenant._id });
    const globalCount = await Employee.countDocuments({ is_active: { $ne: false }, tenant_id: tenant._id });

    console.log(`\nGlobal Context Expected Count: ${globalCount}`);
    console.log(`Department Context Expected Count: ${expectedCount}`);

    // ADMIN TEST
    const adminStats = await getHrAnalytics({ role: 'ADMIN', id: 'some-admin-id' });
    console.log(`\nADMIN Stats -> Total: ${adminStats.employeeStats.total}`);
    console.log(adminStats.employeeStats.total === globalCount ? '✅ ADMIN global scoping OK' : '❌ ADMIN scoping WRONG');

    // HOD TEST
    const hodStats = await getHrAnalytics({ role: 'HEAD OF DEPARTMENT', id: emp.user_id.toString() });
    console.log(`HOD Stats -> Total: ${hodStats.employeeStats.total}`);
    console.log(hodStats.employeeStats.total === expectedCount ? '✅ HOD department scoping OK' : '❌ HOD scoping WRONG');

    // EMPLOYEE TEST
    const empStats = await getHrAnalytics({ role: 'EMPLOYEE', id: emp.user_id.toString() });
    console.log(`EMPLOYEE Stats -> Total: ${empStats.employeeStats.total}`);
    console.log(empStats.employeeStats.total === expectedCount ? '✅ EMPLOYEE department scoping OK' : '❌ EMPLOYEE scoping WRONG');

  });

  await mongoose.disconnect();
}

test();
