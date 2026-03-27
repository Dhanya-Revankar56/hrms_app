const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

require(path.join(__dirname, "../../src/modules/employee/model"));
const Leave = require(path.join(__dirname, "../../src/modules/leave/model"));

async function findDetails() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);

    const today = new Date("2026-03-23");
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate()+1);

    const leavesToday = await Leave.find({ 
      from_date: { $lte: tomorrow },
      to_date: { $gte: today }
    }).populate("employee_id").lean();

    console.log("\n--- All Leaves for Today (2026-03-23) ---");
    if (leavesToday.length === 0) {
      console.log("No leaves found for today.");
    } else {
      leavesToday.forEach(l => {
        console.log(`- ${l.employee_id?.first_name} ${l.employee_id?.last_name}: ${l.leave_type} | Status: ${l.status} | Inst: ${l.institution_id}`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

findDetails();
