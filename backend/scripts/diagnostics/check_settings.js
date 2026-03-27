const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Settings = require('../../src/modules/settings/model');
    const settings = await Settings.find({}, "institution_id institution_name").lean();
    console.log("--- SETTINGS (Institutions) ---");
    console.log(JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
