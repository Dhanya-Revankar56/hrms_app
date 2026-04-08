const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const relievingSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String, index: true }, // Legacy
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employee_code: { type: String },
    resignation_date: { type: Date, required: true },
    last_working_date: { type: Date, required: true },
    notice_period_days: { type: Number, default: 30 },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending Approval", "Approved", "Clearance In Progress", "Relieved", "Rejected"],
      default: "Pending Approval",
    },
    exit_interview_done: { type: Boolean, default: false },
    assets_returned: { type: Boolean, default: false },
    clearance_status: {
      hr: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
      it: { type: Boolean, default: false },
      admin: { type: Boolean, default: false },
    },
    relieve_letter_path: { type: String, default: "" },
    remarks: { type: String, default: "" },
    initiated_by: {
      user_id: { type: String, default: "" },
      user_name: { type: String, default: "" },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);


// Apply tenant isolation
tenantPlugin(relievingSchema);

module.exports = mongoose.model("Relieving", relievingSchema);
