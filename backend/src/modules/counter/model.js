const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  institution_id: { type: String, required: true },
  model_name: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness per institution/model
counterSchema.index({ institution_id: 1, model_name: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);
