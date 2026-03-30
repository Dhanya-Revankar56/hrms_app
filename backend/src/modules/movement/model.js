const mongoose = require("mongoose");

const movementSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
    employee_id: {
      type: String,
      required: true,
      ref: "Employee",
      index: true,
    },
    employee_code: { type: String },
    movement_type: {
      type: String,
      enum: ["official", "personal", "visit", "other", "Exam Duty", "Bank Visit", "Medical Appointment", "Outside Meeting", "Personal Emergency", "Official Field Work", "Government Office", "Other"],
      required: true,
    },
    from_location: { type: String },
    to_location: { type: String },
    purpose: { type: String, default: "" },
    movement_date: { type: Date, required: true },
    out_time: { type: String },
    in_time: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },

    // Dept Admin (HOD) Approval
    dept_admin_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    dept_admin_id: { type: String, default: "" },
    dept_admin_date: { type: Date },
    dept_admin_remarks: { type: String, default: "" },

    // Admin Approval
    admin_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    admin_id: { type: String, default: "" },
    admin_date: { type: Date },
    admin_remarks: { type: String, default: "" },

    remarks: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movementSchema.virtual("employee", {
  ref: "Employee",
  localField: "employee_id",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model("MovementRegister", movementSchema);
