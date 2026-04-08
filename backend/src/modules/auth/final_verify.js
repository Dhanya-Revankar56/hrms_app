const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = 'mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority';

async function finalCheck() {
  console.log('Final Data Verification for Relieving, Holidays, and EventLogs...');
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    
    const targetTenantId = new ObjectId('69cf9ab6ba557bc5c95ede7c'); // COLLEGE_A
    
    const collections = ['relievings', 'holidays', 'eventlogs'];
    
    for (const collName of collections) {
      const coll = db.collection(collName);
      const total = await coll.countDocuments({});
      const withTenant = await coll.countDocuments({ tenant_id: targetTenantId });
      const withStringTenant = await coll.countDocuments({ tenant_id: { $type: 'string' } });
      const withLegacyId = await coll.countDocuments({ institution_id: 'COLLEGE_A' });

      console.log(`\nCollection: ${collName}`);
      console.log(`  - Total Docs: ${total}`);
      console.log(`  - Docs with correct ObjectId tenant_id (COLLEGE_A): ${withTenant}`);
      console.log(`  - Docs with INCORRECT String tenant_id: ${withStringTenant}`);
      console.log(`  - Docs matching legacy institution_id: ${withLegacyId}`);

      if (withTenant === 0 && withLegacyId > 0) {
        console.log(`  !!! ALERT: Found documents with legacy ID but NO tenant_id. Fixing now...`);
        await coll.updateMany(
          { institution_id: 'COLLEGE_A', tenant_id: { $exists: false } },
          { $set: { tenant_id: targetTenantId } }
        );
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

finalCheck();
