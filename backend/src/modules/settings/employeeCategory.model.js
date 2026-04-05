const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const employeeCategorySchema = new mongoose.Schema(
  {
    // 🛡 Multi-tenant context
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    institution_id: { type: String, index: true }, // Keeping for legacy support

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
  { tenant_id: 1, name: 1 },
  { unique: true }
);

// Apply tenant isolation
tenantPlugin(employeeCategorySchema);

module.exports = mongoose.model("EmployeeCategory", employeeCategorySchema);
