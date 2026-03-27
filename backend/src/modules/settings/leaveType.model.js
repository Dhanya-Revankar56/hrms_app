const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
{
  institution_id: { type: String, required: true, index: true },

  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  code: {
    type: String,
    trim: true,
    uppercase: true
  },

  total_days: {
    type: Number,
    default: 0,
    min: 0
  },

  max_per_request: {
    type: Number,
    default: 0
  },

  max_consecutive_leaves: {
    type: Number,
    default: 0
  },

  days_before_apply: {
    type: Number,
    default: 0
  },

  max_consecutive_days: {
    type: Number,
    default: 0
  },

  weekends_covered: {
    type: Boolean,
    default: false
  },

  holiday_covered: {
    type: Boolean,
    default: false
  },

  user_entry: {
    type: Boolean,
    default: true
  },

  balance_enabled: {
    type: Boolean,
    default: true
  },

  workload_interchange: {
    type: Boolean,
    default: false
  },

  document_required: {
    type: Boolean,
    default: false
  },

  leave_category: {
    type: String,
    enum: ["paid", "unpaid"],
    default: "paid"
  },

  applicable_for: {
    type: [String],
    enum: ["Male", "Female", "Other"],
    default: ["Male", "Female", "Other"]
  },

  reset_cycle: {
    type: String,
    enum: ["yearly", "monthly"],
    default: "yearly"
  },

  description: {
    type: String,
    default: ""
  },

  is_active: {
    type: Boolean,
    default: true
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },

  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  }
},
{
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
}
);

// 🔥 Indexes
leaveTypeSchema.index(
  { institution_id: 1, name: 1 },
  { unique: true }
);

leaveTypeSchema.index(
  { institution_id: 1, code: 1 },
  { unique: true }
);

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
