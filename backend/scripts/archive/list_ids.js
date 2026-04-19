const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const Settings = require("../backend/src/modules/settings/model");

async function listIDs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const ids = await Settings.distinct("institution_id");
    console.log("Unique Institution IDs in Settings:", ids);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listIDs();
