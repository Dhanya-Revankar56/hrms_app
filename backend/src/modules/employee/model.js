const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const tenantPlugin = require("../../middleware/tenantPlugin");

// 🛡 Load dependencies to ensure Mongoose registration
require("../settings/department.model");
require("../settings/designation.model");

const employeeSchema = new mongoose.Schema(
  {
    // 🛡 Strict Multi-tenancy
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    // 🏷 Legacy Support (Keep for migration phase)
    institution_id: {
      type: String,
      index: true
    },
    // 🆔 Auth Link
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // 🆔 Business ID
    employee_id: {
      type: String,
      required: true,
      index: true
    },
    // 👤 Basic Info
    name: { type: String, required: true },
    first_name: { type: String }, // Legacy
    last_name: { type: String }, // Legacy
    user_contact: {
      type: String,
      match: /^[0-9]{10}$/
    },
    employee_image: { type: String, default: "" },
    // 🧾 Personal Details
    personal_detail: {
      date_of_birth: { type: Date },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      marital_status: { type: String, enum: ["Single", "Married", "Divorced", "Widowed"] },
      blood_group: { type: String },
      aadhar_no: { type: String },
      pan_no: { type: String },
      religion: { type: String },
      category: { type: String }
    },
    // 💼 Work Details
    work_detail: {
      joining_date: { type: Date },
      department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
      },
      designation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Designation"
      },
      employee_type: {
        type: String,
        enum: ["Permanent", "Contract", "Intern", "Regular", "Probation", "Trainee", "Full-Time", "Part-Time"]
      },
      reporting_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
      }
    },
    // 🏦 Bank Detail
    bank_detail: [
      {
        bank_name: { type: String },
        account_no: { type: String },
        ifsc: { type: String },
        bank_type: { type: String, enum: ["Primary", "Secondary"] }
      }
    ],
    // 📊 Status
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave", "relieved"],
      default: "active",
      index: true
    },
    // 🛑 Relieving Details
    relieved_at: { type: Date },
    relieved_reason: { type: String },
    // 🛠 Audit Fields
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: false
  }
);

// 🔥 Compound Index (Ensures ID uniqueness per tenant)
// Apply tenant isolation
tenantPlugin(employeeSchema);

module.exports = mongoose.model("Employee", employeeSchema);
