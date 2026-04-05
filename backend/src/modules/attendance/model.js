const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const attendanceSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String, index: true }, // Legacy
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


// Apply tenant isolation
tenantPlugin(attendanceSchema);

module.exports = mongoose.model("Attendance", attendanceSchema);
