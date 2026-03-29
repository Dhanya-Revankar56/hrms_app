const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".../../.env") });

// Models
const Department = require("../src/modules/settings/department.model");
const Designation = require("../src/modules/settings/designation.model");

async function migrate() {
  console.log("🚀 Starting Designation Hierarchy Migration...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const designations = await Designation.find({ department: { $exists: false } });
    console.log(`📋 Found ${designations.length} designations without a department`);

    for (const desg of designations) {
      const instId = desg.institution_id;
      
      // Find a default department for this institution
      let dept = await Department.findOne({ institution_id: instId });
      
      if (!dept) {
        // Create a default "General" department if none exists
        dept = await Department.create({
          institution_id: instId,
          name: "general"
        });
        console.log(`   ➕ Created 'general' department for inst: ${instId}`);
      }

      await Designation.updateOne({ _id: desg._id }, { $set: { department: dept._id } });
      console.log(`   ✅ Assigned ${desg.name} to department: ${dept.name}`);
    }

    console.log("🏁 Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

migrate();
