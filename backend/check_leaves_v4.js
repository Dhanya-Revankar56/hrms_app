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
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    const leaves = await Leave.find().sort({ _id: -1 }).limit(10).lean();
    console.log(`Found ${leaves.length} leaves.`);
    leaves.forEach(l => {
      console.log(`ID: ${l._id}, Status: ${l.status}, Type: ${l.leave_type}, Dates: ${l.from_date?.toISOString()} to ${l.to_date?.toISOString()}, Inst: ${l.institution_id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

check();
