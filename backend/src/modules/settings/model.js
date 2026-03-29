const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
{
  institution_id: { type: String, required: true, unique: true, index: true },

  institution_name: String,
  institution_short_name: String,
  institution_code: { type: String, index: true },
  institution_logo: String,

  owner_name: String,

  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },

  pan_number: String,
  registration_number: String,

  website_url: String,
  fax_number: String,

  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pin_code: String
  },

  contact_email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  contact_phone: String,
  contact_mobile: String,

  working_days: {
    type: [String],
    enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    default: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  },

  working_hours: {
    start: String,
    end: String
  },

  notice_period_days: { type: Number, default: 30 },

  employee_id_prefix: { type: String, default: "EMP" },

  holidays: [
    {
      date: { type: Date, required: true },
      name: { type: String, required: true }
    }
  ],

  movement_settings: {
    limit_count: { type: Number, default: 4 },
    limit_frequency: { type: String, enum: ["Weekly", "Monthly", "Yearly"], default: "Weekly" },
    max_duration_mins: { type: Number, default: 60 },
    days_before_apply: { type: Number, default: 4 },
    user_entry: { type: Boolean, default: true },
    limit_enabled: { type: Boolean, default: true }
  },

  timezone: { type: String, default: "Asia/Kolkata" }
},
{
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
}
);

module.exports = mongoose.model("Settings", settingsSchema);
