const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const TARGET_ID = "COLLEGE_A";
    const OLD_ID = "Campus Alpha";

    // 1. Revert rename
    console.log(`🔄 Reverting ${OLD_ID} -> ${TARGET_ID}...`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const colDef of collections) {
      const col = mongoose.connection.db.collection(colDef.name);
      await col.updateMany({ institution_id: OLD_ID }, { $set: { institution_id: TARGET_ID } });
    }

    const Employee = require('../../src/modules/employee/model');
    const Department = require('../../src/modules/settings/department.model');
    const Designation = require('../../src/modules/settings/designation.model');

    // 2. Migrate Employees
    const employees = await Employee.find({ institution_id: TARGET_ID }).lean();
    console.log(`📋 Processing ${employees.length} employees...`);

    for (const emp of employees) {
        let deptVal = emp.work_detail?.department;
        let desgVal = emp.work_detail?.designation;
        let changed = false;

        // Dept
        if (deptVal && typeof deptVal === 'string' && !mongoose.Types.ObjectId.isValid(deptVal)) {
            const name = deptVal.trim();
            // Use findOneAndUpdate with upsert to avoid race conditions/duplicates
            const dept = await Department.findOneAndUpdate(
                { institution_id: TARGET_ID, name: { $regex: new RegExp("^" + name + "$", "i") } },
                { $setOnInsert: { institution_id: TARGET_ID, name, is_active: true } },
                { upsert: true, new: true }
            );
            deptVal = dept._id;
            changed = true;
        }

        // Desg
        if (desgVal && typeof desgVal === 'string' && !mongoose.Types.ObjectId.isValid(desgVal)) {
            const name = desgVal.trim();
            const deptId = deptVal; // Use the migrated ID if available
            
            // For designation, we must include department in filter to avoid DuplicateKey if HOD exists in multiple depts
            // BUT if it's currently null, just search by name
            const desg = await Designation.findOneAndUpdate(
                { institution_id: TARGET_ID, name: { $regex: new RegExp("^" + name + "$", "i") }, department: mongoose.Types.ObjectId.isValid(deptId) ? deptId : null },
                { $setOnInsert: { institution_id: TARGET_ID, name, department: mongoose.Types.ObjectId.isValid(deptId) ? deptId : null, is_active: true } },
                { upsert: true, new: true }
            );
            desgVal = desg._id;
            changed = true;
        }

        if (changed) {
            await Employee.updateOne({ _id: emp._id }, { $set: { "work_detail.department": deptVal, "work_detail.designation": desgVal } });
            console.log(`   ✅ Migrated ${emp.first_name}`);
        }
    }

    console.log("🏁 Final Reconciliation Complete!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
