const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const INST_ID = "Campus Alpha";
    const Employee = require('../../src/modules/employee/model');
    const Department = require('../../src/modules/settings/department.model');
    const Designation = require('../../src/modules/settings/designation.model');

    // 1. Rename institution_id
    await mongoose.connection.db.collection('employees').updateMany({ institution_id: "COLLEGE_A" }, { $set: { institution_id: INST_ID } });
    await mongoose.connection.db.collection('departments').updateMany({ institution_id: "COLLEGE_A" }, { $set: { institution_id: INST_ID } });
    await mongoose.connection.db.collection('designations').updateMany({ institution_id: "COLLEGE_A" }, { $set: { institution_id: INST_ID } });

    // 2. Clear old master data to avoid index conflicts during reconciliation
    // But only if we are absolutely sure. Let's just be careful.

    const employees = await Employee.find({ institution_id: INST_ID }).lean();
    console.log(`📋 Processing ${employees.length} employees...`);

    const deptMap = {}; // name -> _id
    const desgMap = {}; // name -> _id

    for (const emp of employees) {
        let deptVal = emp.work_detail?.department;
        let desgVal = emp.work_detail?.designation;

        // Ensure Department is ObjectId
        if (deptVal && typeof deptVal === 'string' && !mongoose.Types.ObjectId.isValid(deptVal)) {
            const name = deptVal.trim();
            if (!deptMap[name]) {
                let dept = await Department.findOne({ institution_id: INST_ID, name: { $regex: new RegExp("^" + name + "$", "i") } });
                if (!dept) {
                    dept = await Department.create({ institution_id: INST_ID, name, is_active: true });
                }
                deptMap[name] = dept._id;
            }
            deptVal = deptMap[name];
        }

        // Ensure Designation is ObjectId
        if (desgVal && typeof desgVal === 'string' && !mongoose.Types.ObjectId.isValid(desgVal)) {
            const name = desgVal.trim();
            if (!desgMap[name]) {
                let desg = await Designation.findOne({ institution_id: INST_ID, name: { $regex: new RegExp("^" + name + "$", "i") } });
                if (!desg) {
                    desg = await Designation.create({ institution_id: INST_ID, name, department: mongoose.Types.ObjectId.isValid(deptVal) ? deptVal : null, is_active: true });
                }
                desgMap[name] = desg._id;
            }
            desgVal = desgMap[name];
        }

        // Final Update
        await Employee.updateOne(
            { _id: emp._id },
            { $set: { "work_detail.department": deptVal, "work_detail.designation": desgVal } }
        );
    }

    console.log("🏁 Reconciliation Complete!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
