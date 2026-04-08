const mongoose = require("mongoose");

// Define schema inline to avoid module resolution issues
const leaveSchema = new mongoose.Schema({
  institution_id: String,
  employee_id: mongoose.Schema.Types.ObjectId,
  from_date: Date,
  to_date: Date,
  status: String,
  leave_type: String,
});
const Leave = mongoose.model("LeaveCheck", leaveSchema, "leaves");

async function check() {
  try {
    await mongoose.connect("mongodb://localhost:27017/hrms");
    const leaves = await Leave.find().sort({ _id: -1 }).limit(5).lean();
    console.log("Last 5 leaves found:");
    leaves.forEach((l) => {
      console.log(
        `ID: ${l._id}, Status: ${l.status}, Type: ${l.leave_type}, Dates: ${l.from_date?.toISOString()} to ${l.to_date?.toISOString()}, Inst: ${l.institution_id}`,
      );
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
