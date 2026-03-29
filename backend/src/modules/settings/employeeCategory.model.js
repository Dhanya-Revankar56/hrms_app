const mongoose = require("mongoose");

const employeeCategorySchema = new mongoose.Schema(
{
  institution_id: { type: String, required: true, index: true },

  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  short_name: {
    type: String,
    trim: true
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

employeeCategorySchema.index(
  { institution_id: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("EmployeeCategory", employeeCategorySchema);
