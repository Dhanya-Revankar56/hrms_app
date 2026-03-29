const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // 🔐 Multi-tenancy
    institution_id: {
      type: String,
      required: true,
      index: true
    },
    // 🆔 Business ID
    employee_id: {
      type: String,
      unique: true,
      index: true
    },
    // 👤 Basic Info
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    user_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    user_contact: {
      type: String,
      match: /^[0-9]{10}$/
    },
    employee_image: { type: String, default: "" },
    // 🧾 Personal Details
    personal_detail: {
      date_of_birth: { type: Date },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      marital_status: { type: String, enum: ["Single", "Married"] },
      blood_group: { type: String },
      aadhar_no: { type: String },
      pan_no: { type: String },
      pf_no: { type: String },
      esic_no: { type: String }
    },
    // 💼 Work Details
    work_detail: {
      date_of_joining: { type: Date },
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
        // Broadening enum to accommodate actual settings data
        enum: ["Permanent", "Contract", "Intern", "Regular", "Contarct", "Probation", "Trainee"]
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
    // 📊 Status & Role
    app_status: {
      type: String,
      enum: ["active", "inactive", "on-leave", "relieved"],
      default: "active"
    },
    app_role: {
      type: String,
      enum: ["employee", "hod", "admin"],
      default: "employee"
    },
    // 🛑 Relieving Details
    relieved_at: { type: Date },
    relieved_reason: { type: String },
    // 🛠 Audit Fields
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
  },
  {
    timestamps: false // Manual timestamps as per your audit requirement
  }
);

// 🔥 Compound Index (Ensures ID uniqueness per college)
employeeSchema.index({ institution_id: 1, employee_id: 1 }, { unique: true });

module.exports = mongoose.model("Employee", employeeSchema);
