const mongoose = require("mongoose");

const salaryRecordSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
    
    monthly_ctc: { type: Number, default: 0 },
    annual_ctc: { type: Number, default: 0 },
    net_monthly_salary: { type: Number, default: 0 },
    net_annual_salary: { type: Number, default: 0 },
    
    earnings: {
      basic: { type: Number, default: 0 },
      agp: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
    },
    
    effective_from: String,
    status: { type: String, default: "active" }, // active, history
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const payslipSchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    
    month: { type: String, required: true }, // e.g. "2026-03"
    amount: { type: Number, required: true },
    pdf_url: { type: String, default: "" },
    status: { type: String, default: "generated" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const SalaryRecord = mongoose.model("SalaryRecord", salaryRecordSchema);
const Payslip = mongoose.model("Payslip", payslipSchema);

module.exports = { SalaryRecord, Payslip };
