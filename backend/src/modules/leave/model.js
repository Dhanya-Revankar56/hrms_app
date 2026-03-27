const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employee_code: { type: String },
    leave_type: {
      type: String,
      required: true,
    },
    from_date: { type: Date, required: true },
    to_date: { type: Date, required: true },
    total_days: { type: Number, default: 1 },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "closed"],
      default: "pending",
    },
    
    // Dept Admin Approval
    dept_admin_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    dept_admin_id: { type: String, default: "" },
    dept_admin_date: { type: Date },
    dept_admin_remarks: { type: String, default: "" },

    // Admin Approval
    admin_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    admin_id: { type: String, default: "" },
    admin_date: { type: Date },
    admin_remarks: { type: String, default: "" },

    // Structured Approvals
    approvals: [
      {
        role: { type: String, enum: ["HOD", "ADMIN"], required: true },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        updated_at: { type: Date },
        updated_by: { type: String },
        remarks: { type: String, default: "" },
      },
    ],

    requested_date: { type: Date, default: Date.now },
    is_half_day: { type: Boolean, default: false },
    half_day_type: {
      type: String,
      enum: ["first_half", "second_half", ""],
      default: "",
    },
    document_url: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Leave", leaveSchema);
