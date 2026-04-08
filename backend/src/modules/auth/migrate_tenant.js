const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = 'mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority';

const mapping = {
  'COLLEGE_A': '69cf9ab6ba557bc5c95ede7c',
  'COLLEGE_B': '69cf9ab6ba557bc5c95ede89',
  'TEST_CLG_001': '69cf9ab6ba557bc5c95ede8d'
};

const collections = [
  'employees', 'holidays', 'leaves', 'relievings', 'movementregisters',
  'settings', 'departments', 'designations', 'leave_types', 'employee_categories',
  'employee_types', 'event_logs', 'salary_records', 'payslips', 'counters'
];

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected naturally!');

    for (const [inst, tenant] of Object.entries(mapping)) {
      console.log(`Processing Institution: ${inst} (${tenant})...`);
      for (const coll of collections) {
        try {
          const result = await db.collection(coll).updateMany(
            { institution_id: inst, tenant_id: { $exists: false } },
            { $set: { tenant_id: new ObjectId(tenant) } }
          );
          if (result.matchedCount > 0) {
            console.log(`- Migrated ${result.modifiedCount}/${result.matchedCount} docs in ${coll} for ${inst}`);
          }
        } catch (err) {
          // Some collections might not exist or might not have institution_id
          // console.warn(`- Skipping ${coll}: ${err.message}`);
        }
      }
    }
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
