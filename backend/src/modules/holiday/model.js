const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    institution_id: { type: String, required: true, index: true },
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

holidaySchema.index({ institution_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
