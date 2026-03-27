const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
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

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
