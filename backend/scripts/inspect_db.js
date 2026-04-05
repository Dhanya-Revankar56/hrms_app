const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to DB');

    const holidayCount = await mongoose.connection.db.collection('holidays').countDocuments();
    const relievingCount = await mongoose.connection.db.collection('relievings').countDocuments();

    console.log(`Holidays count: ${holidayCount}`);
    console.log(`Relievings count: ${relievingCount}`);

    if (holidayCount > 0) {
      const sampleHoliday = await mongoose.connection.db.collection('holidays').findOne();
      console.log('Sample Holiday fields:', Object.keys(sampleHoliday));
      console.log('Sample Holiday tenant_id:', sampleHoliday.tenant_id);
    }

    if (relievingCount > 0) {
      const sampleRelieving = await mongoose.connection.db.collection('relievings').findOne();
      console.log('Sample Relieving fields:', Object.keys(sampleRelieving));
    }

    const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
    console.log('Users (tenant_id):', users.map(u => ({ id: u._id, email: u.email, tenant_id: u.tenant_id })));

    const employees = await mongoose.connection.db.collection('employees').find({}).limit(5).toArray();
    console.log('Employees (user_id vs _id):', employees.map(e => ({ id: e._id, user_id: e.user_id })));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
