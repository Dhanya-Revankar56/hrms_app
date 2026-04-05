const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = 'mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority';

const collections = [
  'employees', 'holidays', 'leaves', 'relievings', 'movementregisters',
  'settings', 'departments', 'designations', 'leave_types', 'employee_categories',
  'employee_types', 'event_logs', 'salary_records', 'payslips', 'counters'
];

async function convertTypes() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    console.log('Connected!');

    for (const collName of collections) {
      console.log(`Checking collection: ${collName}...`);
      const coll = db.collection(collName);
      
      // Find documents where tenant_id is a string
      const cursor = coll.find({ tenant_id: { $type: 'string' } });
      let count = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (typeof doc.tenant_id === 'string' && doc.tenant_id.length === 24) {
          await coll.updateOne(
            { _id: doc._id },
            { $set: { tenant_id: new ObjectId(doc.tenant_id) } }
          );
          count++;
        }
      }

      if (count > 0) {
        console.log(`- Converted ${count} documents in ${collName} to use ObjectId tenant_id`);
      }
    }

    console.log('\nType conversion completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

convertTypes();
