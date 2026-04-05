const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String, index: true }, // Legacy
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leave_type: {
      type: String,
      required: true,
    },
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const { applyTenantPlugin } = require("../../middleware/tenantPlugin");

// Apply plugin for multi-tenant isolation
applyTenantPlugin(leaveBalanceSchema);

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
