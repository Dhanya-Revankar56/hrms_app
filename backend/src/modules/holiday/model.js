const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const holidaySchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String, index: true }, // Legacy support
    name: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["public", "restricted", "other"], default: "public" },
    description: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

holidaySchema.index({ tenant_id: 1, date: 1 }, { unique: true });

// Apply tenant isolation
tenantPlugin(holidaySchema);

module.exports = mongoose.model("Holiday", holidaySchema);
