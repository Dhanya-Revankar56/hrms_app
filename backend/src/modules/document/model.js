const mongoose = require("mongoose");

const employeeDocumentSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
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

module.exports = mongoose.model("EmployeeDocument", employeeDocumentSchema);
