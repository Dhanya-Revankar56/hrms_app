const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    // 🏷 Metadata: device, IP, path, request_id
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false // Manual timestamp as per your audit requirement
  }
);

// Optimize for fast lookups by tenant + timestamp
auditLogSchema.index({ tenant_id: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
