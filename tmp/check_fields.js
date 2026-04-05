require('dotenv').config({ path: 'backend/.env' });
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const emp = await db.collection('employees').findOne({
      $or: [
        { user_email: /dhanya/i },
        { email: /dhanya/i }
      ]
    });
    
    if (emp) {
      console.log('👤 Employee Found Keys:', Object.keys(emp));
      console.log('📧 Email Field (user_email):', emp.user_email || 'NOT_FOUND');
      console.log('📧 Email Field (email):', emp.email || 'NOT_FOUND');
      console.log('🔑 Password Field:', emp.password ? 'EXISTS' : 'MISSING');
      console.log('🆔 Institution ID:', emp.institution_id || 'NOT_FOUND');
    } else {
      console.log('❌ Employee NOT_FOUND');
    }
  } finally {
    await client.close();
  }
}
run();
