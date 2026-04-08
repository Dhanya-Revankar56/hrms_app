const mongoose = require('mongoose');
require('dotenv').config();
const { login } = require('./src/modules/auth/service');
const Employee = require('./src/modules/employee/model');
const User = require('./src/modules/auth/user.model');
const { runWithTenant } = require('./src/middleware/tenantContext');
const { resolvers } = require('./src/modules');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const Tenant = require('./src/modules/tenant/model');
  const tenant = await Tenant.findOne();
  if (!tenant) { process.exit(0); }

  await runWithTenant({ tenantId: tenant._id }, async () => {
    
    // 1. Create a dummy employee and then deactivate them
    const email = 'relieved.test@test.com';
    await User.deleteOne({ email });
    
    const user = new User({ email, password: 'password123', role: 'EMPLOYEE', tenant_id: tenant._id, isActive: false });
    await user.save();
    
    const emp = new Employee({
        name: 'Relieved Test',
        employee_id: 'R-001',
        user_id: user._id,
        tenant_id: tenant._id,
        is_active: false,
        status: 'inactive'
    });
    await emp.save();

    console.log(`\nCreated inactive user: ${email}`);

    // TEST 1: Login Blocking
    console.log('\nTesting Login for inactive user...');
    try {
      await login(email, 'password123');
      console.log('❌ Login was unexpectedly successful!');
    } catch (err) {
      if (err.message.includes('deactivated')) {
        console.log(`✅ Login blocked correctly: ${err.message}`);
      } else {
        console.log(`❌ Login blocked but with wrong message: ${err.message}`);
      }
    }

    // TEST 2: Employee Management Visibility
    console.log('\nTesting visibility in getAllEmployees...');
    const ctx = { user: { id: 'admin-id', role: 'ADMIN', tenant_id: tenant._id } };
    const emps = await resolvers.Query.getAllEmployees(null, {}, ctx);
    const found = emps.items.find(e => e.employee_id === 'R-001');
    if (found) {
      console.log(`✅ Relieved employee visible in list: ${found.name} (Status: ${found.status})`);
    } else {
      console.log('❌ Relieved employee NOT found in list!');
    }

    // Cleanup
    await Employee.deleteOne({ employee_id: 'R-001' });
    await User.deleteOne({ email });
  });

  await mongoose.disconnect();
}

test();
