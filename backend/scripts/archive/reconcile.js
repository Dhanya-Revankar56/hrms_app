const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const colNames = collections.map((c) => c.name);

    // 1. Rename COLLEGE_A to Campus Alpha across ALL collections
    console.log("🔄 Renaming COLLEGE_A to 'Campus Alpha'...");
    for (const name of colNames) {
      const col = mongoose.connection.db.collection(name);
      const result = await col.updateMany(
        { institution_id: "COLLEGE_A" },
        { $set: { institution_id: "Campus Alpha" } },
      );
      if (result.matchedCount > 0) {
        console.log(`   ✅ Updated ${result.modifiedCount} records in ${name}`);
      }
    }

    const INST_ID = "Campus Alpha";

    // 2. Models
    const Employee = require("../../src/modules/employee/model");
    const Department = require("../../src/modules/settings/department.model");
    const Designation = require("../../src/modules/settings/designation.model");
    const Settings = require("../../src/modules/settings/model");

    // Ensure Settings exists
    await Settings.findOneAndUpdate(
      { institution_id: INST_ID },
      { $set: { institution_name: "Campus Alpha" } },
      { upsert: true },
    );

    // 3. Migrate Employees work_detail
    const employees = await Employee.find({ institution_id: INST_ID });
    console.log(
      `📋 Processing ${employees.length} employees for ${INST_ID}...`,
    );

    for (const emp of employees) {
      console.log(
        `🔍 Checking employee: ${emp.firstName || emp.first_name} | Dept: ${emp.work_detail?.department} | Desg: ${emp.work_detail?.designation}`,
      );
      let changed = false;
      const newWorkDetail = { ...emp.work_detail };

      // Handle Department
      if (
        newWorkDetail.department &&
        !mongoose.Types.ObjectId.isValid(newWorkDetail.department)
      ) {
        const deptName = String(newWorkDetail.department).trim();
        let dept = await Department.findOne({
          institution_id: INST_ID,
          name: deptName,
        });
        if (!dept) {
          dept = await Department.create({
            institution_id: INST_ID,
            name: deptName,
            is_active: true,
          });
          console.log(`   ➕ Created Department: ${deptName}`);
        }
        newWorkDetail.department = dept._id;
        changed = true;
      }

      // Handle Designation
      if (
        newWorkDetail.designation &&
        !mongoose.Types.ObjectId.isValid(newWorkDetail.designation)
      ) {
        const desgName = String(newWorkDetail.designation).trim();
        const deptId = newWorkDetail.department;

        let desg = await Designation.findOne({
          institution_id: INST_ID,
          name: desgName,
        });
        if (!desg) {
          desg = await Designation.create({
            institution_id: INST_ID,
            name: desgName,
            department: deptId,
            is_active: true,
          });
          console.log(`   ➕ Created Designation: ${desgName}`);
        }
        newWorkDetail.designation = desg._id;
        changed = true;
      }

      if (changed) {
        const upResult = await Employee.updateOne(
          { _id: emp._id },
          { $set: { work_detail: newWorkDetail } },
        );
        console.log(
          `   ✅ Migrated employee: ${emp.first_name} ${emp.last_name} | Modified: ${upResult.modifiedCount}`,
        );
      } else {
        console.log(`   ⏭️ Already migrated or no data for ${emp.first_name}`);
      }
    }

    console.log("🏁 Reconciliation Complete!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    mongoose.disconnect();
  }
}

run();
