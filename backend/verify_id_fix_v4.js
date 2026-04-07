const mongoose = require('mongoose');
require('dotenv').config();
const { applyLeave } = require('./src/modules/leave/service');
const { createMovement } = require('./src/modules/movement/service');
const Employee = require('./src/modules/employee/model');
const { runWithTenant } = require('./src/middleware/tenantContext');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Get an employee to test with - use a dummy tenant context first if needed, or findOne with a specific tenant manually
    // Since we don't know the tenant_id yet, we should use a global query if possible or wrap it.
    // In this repo, the tenantPlugin usually requires a context.
    
    // Let's try to get a tenant first or use a known one.
    const Tenant = require('./src/modules/tenant/model');
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.log('No tenant found');
      process.exit(0);
    }

    await runWithTenant({ tenantId: tenant._id }, async () => {
      const emp = await Employee.findOne().lean();
      if (!emp) {
        console.log('No employee found in tenant:', tenant._id);
        return;
      }

      console.log(`Emp: ${emp.name}, _id: ${emp._id}, user_id: ${emp.user_id}`);

      // Test Leave
      try {
        const leaveInput = {
          employee_id: emp.user_id.toString(),
          leave_type: 'Casual Leave',
          from_date: '2027-08-01',
          to_date: '2027-08-02'
        };
        const res = await applyLeave(leaveInput, { user: { id: emp.user_id } });
        console.log('✅ Leave OK:', res._id);
        await mongoose.connection.db.collection('leaves').deleteOne({ _id: res._id });
      } catch (e) {
        console.error('❌ Leave Error:', e.message);
      }

      // Test Movement
      try {
        const moveInput = {
          employee_id: emp.user_id.toString(),
          movement_date: '2027-08-05',
          movement_type: 'official',
          out_time: '09:00',
          in_time: '10:00',
          purpose: 'Test'
        };
        const res = await createMovement(moveInput, { user: { id: emp.user_id } });
        console.log('✅ Move OK:', res._id);
        await mongoose.connection.db.collection('movements').deleteOne({ _id: res._id });
      } catch (e) {
        console.error('❌ Move Error:', e.message);
      }
    });

  } catch (err) {
    console.error('Fatal:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
