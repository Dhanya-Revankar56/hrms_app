const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
{
  institution_id: { type: String, required: true, index: true },

  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 2
  },

  short_name: {
    type: String,
    trim: true,
    index: true
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

// 🔥 Correct unique constraint
designationSchema.index(
  { institution_id: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Designation", designationSchema);
