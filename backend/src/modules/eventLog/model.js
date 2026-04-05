const mongoose = require("mongoose");
const tenantPlugin = require("../../middleware/tenantPlugin");

const eventLogSchema = new mongoose.Schema(
  {
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    institution_id: { type: String }, // Legacy
    user_id: { type: String },
    user_name: { type: String },
    user_role: { type: String },
    action_type: { type: String, required: true }, // e.g. "EMPLOYEE_RELIEVED"
    module_name: { type: String },
    record_id: { type: String },
    description: { type: String },
    old_data: { type: mongoose.Schema.Types.Mixed },
    new_data: { type: mongoose.Schema.Types.Mixed },
    changes: { type: mongoose.Schema.Types.Mixed },
    ip_address: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);


// Apply tenant isolation
tenantPlugin(eventLogSchema);

module.exports = mongoose.model("EventLog", eventLogSchema);
