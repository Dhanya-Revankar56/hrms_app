const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const TARGET_ID = "COLLEGE_A";

    // 1. Drop old indexes
    console.log("🧹 Dropping old Designation indexes...");
    try {
      await mongoose.connection.db
        .collection("designations")
        .dropIndex("institution_id_1_name_1");
      console.log("   ✅ Dropped institution_id_1_name_1");
    } catch (_e) {
      console.log(
        "   ℹ️ Index institution_id_1_name_1 not found or already dropped",
      );
    }

    const Employee = require("../../src/modules/employee/model");
    const Department = require("../../src/modules/settings/department.model");
    const Designation = require("../../src/modules/settings/designation.model");

    // 2. Refresh indexes (ensure the correct one exists)
    await Designation.syncIndexes();

    // 3. Migrate Employees
    const employees = await Employee.find({ institution_id: TARGET_ID }).lean();
    console.log(`📋 Processing ${employees.length} employees...`);

    for (const emp of employees) {
      let deptVal = emp.work_detail?.department;
      let desgVal = emp.work_detail?.designation;
      let changed = false;

      // Dept
      if (
        deptVal &&
        typeof deptVal === "string" &&
        !mongoose.Types.ObjectId.isValid(deptVal)
      ) {
        const name = deptVal.trim();
        const dept = await Department.findOneAndUpdate(
          {
            institution_id: TARGET_ID,
            name: { $regex: new RegExp("^" + name + "$", "i") },
          },
          {
            $setOnInsert: { institution_id: TARGET_ID, name, is_active: true },
          },
          { upsert: true, new: true },
        );
        deptVal = dept._id;
        changed = true;
      }

      // Desg
      if (
        desgVal &&
        typeof desgVal === "string" &&
        !mongoose.Types.ObjectId.isValid(desgVal)
      ) {
        const name = desgVal.trim();
        const deptId = deptVal;

        const desg = await Designation.findOneAndUpdate(
          {
            institution_id: TARGET_ID,
            name: { $regex: new RegExp("^" + name + "$", "i") },
            department: mongoose.Types.ObjectId.isValid(deptId) ? deptId : null,
          },
          {
            $setOnInsert: {
              institution_id: TARGET_ID,
              name,
              department: mongoose.Types.ObjectId.isValid(deptId)
                ? deptId
                : null,
              is_active: true,
            },
          },
          { upsert: true, new: true },
        );
        desgVal = desg._id;
        changed = true;
      }

      if (changed) {
        await Employee.updateOne(
          { _id: emp._id },
          {
            $set: {
              "work_detail.department": deptVal,
              "work_detail.designation": desgVal,
            },
          },
        );
        console.log(`   ✅ Migrated ${emp.first_name}`);
      }
    }

    console.log("🏁 Ultimate Reconciliation Complete!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
