const mongoose = require('mongoose');
require('dotenv').config();
const { applyLeave } = require('./src/modules/leave/service');
const { createMovement } = require('./src/modules/movement/service');
const Employee = require('./src/modules/employee/model');
const User = require('./src/modules/auth/user.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const emp = await Employee.findOne().lean();
    if (!emp) {
      console.log('No employee found');
      process.exit(0);
    }

    console.log(`Emp: ${emp.name}, _id: ${emp._id}, user_id: ${emp.user_id}`);

    const ctx = {
      user: { id: emp.user_id?.toString(), role: 'EMPLOYEE' },
      tenant_id: emp.tenant_id
    };

    // Use a try-catch for each part
    try {
      const leaveInput = {
        employee_id: emp.user_id.toString(),
        leave_type: 'Casual Leave',
        from_date: '2027-04-01',
        to_date: '2027-04-02'
      };
      const res = await applyLeave(leaveInput, ctx);
      console.log('✅ Leave OK:', res._id);
      await mongoose.connection.db.collection('leaves').deleteOne({ _id: res._id });
    } catch (e) {
      console.error('❌ Leave Error:', e.message);
    }

    try {
      const moveInput = {
        employee_id: emp.user_id.toString(),
        movement_date: '2027-04-05',
        movement_type: 'official',
        out_time: '09:00',
        in_time: '10:00',
        purpose: 'Test'
      };
      const res = await createMovement(moveInput, ctx);
      console.log('✅ Move OK:', res._id);
      await mongoose.connection.db.collection('movements').deleteOne({ _id: res._id });
    } catch (e) {
      console.error('❌ Move Error:', e.message);
    }

  } catch (err) {
    console.error('Fatal:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
