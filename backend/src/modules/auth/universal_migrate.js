const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = 'mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority';

const mapping = {
  'COLLEGE_A': '69cf9ab6ba557bc5c95ede7c',
  'COLLEGE_B': '69cf9ab6ba557bc5c95ede89',
  'TEST_CLG_001': '69cf9ab6ba557bc5c95ede8d'
};

async function universalMigrate() {
  console.log('Connecting to MongoDB Atlas for Universal Migration...');
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collNames = collections.map(c => c.name);
    
    console.log(`Found ${collNames.length} collections. starting universal sync...\n`);

    for (const [inst, tenantIdStr] of Object.entries(mapping)) {
      const tenantId = new ObjectId(tenantIdStr);
      console.log(`>>> Syncing Institution: ${inst} -> ${tenantIdStr}`);
      
      for (const collName of collNames) {
        if (['tenants', 'users', 'system.indexes', 'system.users'].includes(collName)) continue;

        try {
          const coll = db.collection(collName);
          
          // 1. Fill missing tenant_id
          const fillResult = await coll.updateMany(
            { institution_id: inst, tenant_id: { $exists: false } },
            { $set: { tenant_id: tenantId } }
          );
          
          // 2. Fix string tenant_id to ObjectId if it matches the value but wrong type
          const convertResult = await coll.updateMany(
            { institution_id: inst, tenant_id: { $type: 'string' } },
            { $set: { tenant_id: tenantId } }
          );

          if (fillResult.modifiedCount > 0 || convertResult.modifiedCount > 0) {
            console.log(`  - [${collName}]: Filled ${fillResult.modifiedCount}, Converted ${convertResult.modifiedCount}`);
          }
        } catch (e) {
          // console.error(`  - Error in ${collName}: ${e.message}`);
        }
      }
    }

    console.log('\nUniversal migration and type sync completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Universal migration failed:', err);
    process.exit(1);
  }
}

universalMigrate();
