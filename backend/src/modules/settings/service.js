const Settings = require("./model");
const AuditLog = require("../audit/model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");
const { getTenantId } = require("../../middleware/tenantContext");
const Department = require("./department.model");
const Designation = require("./designation.model");
const LeaveType = require("./leaveType.model");
const EmployeeCategory = require("./employeeCategory.model");
const EmployeeType = require("./employeeType.model");

const MASTER_DATA_MODELS = {
  departments: Department,
  designations: Designation,
  leave_types: LeaveType,
  employee_categories: EmployeeCategory,
  employee_types: EmployeeType
};

exports.getSettings = async (tenant_id) => {
  const settings = await Settings.findOne(withTenant({ tenant_id })).lean();
  if (!settings) {
    return {
      tenant_id,
      institution_id: tenant_id,
      leave_settings: { carry_forward_enabled: false },
      movement_settings: { limit_enabled: false }
    };
  }
  return settings;
};

exports.updateSettings = async (data, context) => {
  const filter = withTenant({});
  const updated = await Settings.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  await AuditLog.create({
    action: "SETTINGS_UPDATED",
    user_id: getUserIdFromCtx(context),
    tenant_id: filter.tenant_id,
    metadata: { fields: Object.keys(data) }
  });

  return updated;
};

// 🏛 Master Data CRUD (Refactored for Multi-Tenancy)
exports.listMasterData = async (type) => {
  const Model = MASTER_DATA_MODELS[type];
  if (!Model) throw new Error(`Invalid master data type: ${type}`);
  return await Model.find(withTenant({})).sort({ name: 1 }).lean();
};

exports.upsertMasterData = async (type, input, context) => {
  const Model = MASTER_DATA_MODELS[type];
  if (!Model) throw new Error(`Invalid master data type: ${type}`);

  const { id, ...data } = input;
  const filter = id ? withTenant({ _id: id }) : withTenant({ name: data.name });

  const updated = await Model.findOneAndUpdate(
    filter,
    { $set: { ...data, ...withTenant({}) } },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  // 🛡 Audit Log
  const moduleName = type.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).replace(/\s/g, "");
  const actionBase = type.toUpperCase().slice(0, -1); // e.g. DEPARTMENTS -> DEPARTMENT
  
  await AuditLog.create({
    action: `SETTINGS_${actionBase}_${id ? "UPDATED" : "CREATED"}`,
    user_id: getUserIdFromCtx(context),
    tenant_id: getTenantId(),
    metadata: { 
      type, 
      id: updated._id, 
      name: updated.name,
      description: `${id ? "Updated" : "Created"} ${actionBase.toLowerCase().replace(/_/g, " ")}: ${updated.name}`
    }
  });

  return updated;
};

exports.deleteMasterData = async (type, id, context) => {
  const Model = MASTER_DATA_MODELS[type];
  if (!Model) throw new Error(`Invalid master data type: ${type}`);

  const deleted = await Model.findOneAndDelete(withTenant({ _id: id }));
  if (!deleted) return null;

  // 🛡 Audit Log
  const actionBase = type.toUpperCase().slice(0, -1);
  await AuditLog.create({
    action: `SETTINGS_${actionBase}_DELETED`,
    user_id: getUserIdFromCtx(context),
    tenant_id: getTenantId(),
    metadata: { 
      type, 
      id, 
      name: deleted.name,
      description: `Deleted ${actionBase.toLowerCase().replace(/_/g, " ")}: ${deleted.name}`
    }
  });

  return deleted;
};
