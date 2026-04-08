require('dotenv').config();
const mongoose = require('mongoose');
const relievingService = require('../src/modules/relieving/service');
const holidayService = require('../src/modules/holiday/service');
const { runWithTenant } = require('../src/middleware/tenantContext');

async function testFetch() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    return;
  }
  
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'dhanyavernekar@gmail.com' });
  if (!user) {
    console.log('User dhanyavernekar@gmail.com not found. Cannot verify with correct tenant context.');
    await mongoose.disconnect();
    return;
  }

  const tenantId = user.tenant_id;
  console.log('Using Tenant ID:', tenantId);

  await runWithTenant(tenantId, async () => {
    // 1. Test Relievings
    console.log('\n--- Testing Relievings ---');
    const relResult = await relievingService.listRelievings({ pagination: { page: 1, limit: 10 } });
    console.log('Relievings found:', relResult.pageInfo.totalCount);
    if (relResult.items.length > 0) {
      console.log('Example Relieving Status:', relResult.items[0].status);
      console.log('Example Relieving Employee:', relResult.items[0].employee_id?.first_name || 'NOT POPULATED');
    }

    // 2. Test Holidays
    console.log('\n--- Testing Holidays ---');
    const holResult = await holidayService.listHolidays({});
    console.log('Holidays found:', holResult.pageInfo.totalCount);
    if (holResult.items.length > 0) {
      console.log('Example Holiday Name:', holResult.items[0].name);
      console.log('Example Holiday Date:', holResult.items[0].date);
    }
  });

  await mongoose.disconnect();
}

testFetch().catch(console.error);
