const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments({ institution_id: "Campus Alpha" });
      if (count > 0) {
        console.log(`Found ${count} records with institution_id: 'Campus Alpha' in ${col.name}`);
      }
    }
    console.log("Search complete.");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
