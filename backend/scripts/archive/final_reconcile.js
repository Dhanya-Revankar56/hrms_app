const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const INST_ID = "Campus Alpha";
    const Employee = require("../../src/modules/employee/model");
    const Department = require("../../src/modules/settings/department.model");
    const Designation = require("../../src/modules/settings/designation.model");

    const employees = await Employee.find({ institution_id: INST_ID }).lean();
    console.log(`📋 Processing ${employees.length} employees...`);

    for (const emp of employees) {
      let currentDept = emp.work_detail?.department;
      let currentDesg = emp.work_detail?.designation;
      let updatedDept = currentDept;
      let updatedDesg = currentDesg;
      let changed = false;

      // Handle Department
      if (currentDept && !mongoose.Types.ObjectId.isValid(currentDept)) {
        const name = String(currentDept).trim();
        let dept = await Department.findOneAndUpdate(
          {
            institution_id: INST_ID,
            name: { $regex: new RegExp("^" + name + "$", "i") },
          },
          { $setOnInsert: { institution_id: INST_ID, name, is_active: true } },
          { upsert: true, new: true },
        );
        console.log(`   📂 Dept: ${name} -> ${dept._id}`);
        updatedDept = dept._id;
        changed = true;
      }

      // Handle Designation
      if (currentDesg && !mongoose.Types.ObjectId.isValid(currentDesg)) {
        const name = String(currentDesg).trim();
        const deptToUse = updatedDept || currentDept;

        let desg = await Designation.findOneAndUpdate(
          {
            institution_id: INST_ID,
            name: { $regex: new RegExp("^" + name + "$", "i") },
          },
          {
            $setOnInsert: {
              institution_id: INST_ID,
              name,
              department: mongoose.Types.ObjectId.isValid(deptToUse)
                ? deptToUse
                : null,
              is_active: true,
            },
          },
          { upsert: true, new: true },
        );
        console.log(`   🏷️ Desg: ${name} -> ${desg._id}`);
        updatedDesg = desg._id;
        changed = true;
      }

      if (changed) {
        await Employee.updateOne(
          { _id: emp._id },
          {
            $set: {
              "work_detail.department": updatedDept,
              "work_detail.designation": updatedDesg,
            },
          },
        );
        console.log(`   ✅ Updated ${emp.first_name} ${emp.last_name}`);
      }
    }

    console.log("🏁 Migration Complete!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
