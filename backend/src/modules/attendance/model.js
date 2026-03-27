const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employee_code: { type: String },
    date: { type: Date, required: true },
    check_in: { type: String },
    check_out: { type: String },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "holiday", "on_leave"],
      default: "present",
    },
    working_hours: { type: Number, default: 0 },
    overtime_hours: { type: Number, default: 0 },
    note: { type: String, default: "" },
    marked_by: { type: String, default: "system" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
