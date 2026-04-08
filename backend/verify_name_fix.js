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
    
    // 1. Find the "Relieved Test" employee (which was missing first_name)
    const emp = await Employee.findOne({ name: 'Relieved Test' }).lean();
    if (!emp) {
        console.log('Test record not found in DB. Searching for any record without first_name...');
        const anyBad = await Employee.findOne({ first_name: { $exists: false } }).lean();
        if (!anyBad) {
            console.log('No inconsistent records found to test. Creating one...');
            const newEmp = new Employee({ name: 'Fallback Test Person', employee_id: 'TEST-999', tenant_id: tenant._id, user_id: new mongoose.Types.ObjectId() });
            await newEmp.save();
        }
    }

    // 2. Simulate resolving the fields via the Employee resolver
    const testRecord = await Employee.findOne({ name: /Test/ }).lean();
    console.log(`\nTesting resolve for Record Name: "${testRecord.name}"`);
    console.log(`Original DB first_name: ${testRecord.first_name || 'NULL'}`);

    const resolvedFirstName = resolvers.Employee.first_name(testRecord);
    const resolvedLastName = resolvers.Employee.last_name(testRecord);

    console.log(`Resolved first_name: "${resolvedFirstName}"`);
    console.log(`Resolved last_name: "${resolvedLastName}"`);

    if (resolvedFirstName === 'Relieved' || resolvedFirstName === 'Fallback') {
        console.log('✅ Name resolution fallback OK');
    } else {
        console.log('❌ Name resolution fallback WRONG');
    }

    // cleanup if created
    if (testRecord.employee_id === 'TEST-999') {
        await Employee.deleteOne({ _id: testRecord._id });
    }
  });

  await mongoose.disconnect();
}

test();
