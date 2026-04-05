const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    domain: {
      type: String,
      lowercase: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// 🛡 Security: Never allow deleting tenants from the logic (use isActive)
tenantSchema.pre("remove", function(next) {
  next(new Error("Tenants cannot be deleted. Set isActive to false instead."));
});

module.exports = mongoose.model("Tenant", tenantSchema);
