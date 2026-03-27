require("dotenv").config();
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  institution_id: String,
  employee_id: mongoose.Schema.Types.ObjectId,
  from_date: Date,
  to_date: Date,
  status: String,
  leave_type: String
});
const Leave = mongoose.model("LeaveCheck", leaveSchema, "leaves");

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const leaves = await Leave.find().sort({ _id: -1 }).limit(10).lean();
    console.log(`Found ${leaves.length} leaves:`);
    leaves.forEach(l => {
      console.log(`ID: ${l._id}`);
      console.log(`  Status: ${l.status}`);
      console.log(`  Type:   ${l.leave_type}`);
      console.log(`  From:   ${l.from_date?.toISOString()}`);
      console.log(`  To:     ${l.to_date?.toISOString()}`);
      console.log(`  Inst:   ${l.institution_id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

check();
