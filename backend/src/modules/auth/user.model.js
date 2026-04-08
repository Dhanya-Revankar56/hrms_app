const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false // Always hidden unless explicitly selected
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "HEAD OF DEPARTMENT", "EMPLOYEE"],
      default: "EMPLOYEE",
      uppercase: true
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    tenant_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    // 🛡 Brute-force protection
    loginAttempts: {
      type: Number,
      default: 0,
      required: true
    },
    lockUntil: {
      type: Date
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

// 🔥 Compound Index (Ensures email uniqueness per tenant, but allows same email across institutions)
userSchema.index({ tenant_code: 1, email: 1 }, { unique: true });

// 🔐 Password Hashing Hook
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  // 🛡 Defensive Reset: Do not re-hash if it's already a valid bcrypt string
  if (typeof this.password === 'string' && this.password.startsWith("$2b$")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔓 Compare Password Method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
