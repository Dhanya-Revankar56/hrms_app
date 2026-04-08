const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const employeeDocumentSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String, index: true }, // Legacy
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    
    name: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: String,
    status: { type: String, default: "active" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Apply tenant isolation
tenantPlugin(employeeDocumentSchema);

module.exports = mongoose.model("EmployeeDocument", employeeDocumentSchema);
