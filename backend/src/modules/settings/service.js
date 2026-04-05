const Settings = require("./model");
const AuditLog = require("../audit/model");
const { withTenant } = require("../../utils/tenantUtils");
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
    user_id: context?.user?.id || context?.req?.user?.id,
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

exports.upsertMasterData = async (type, input) => {
  const Model = MASTER_DATA_MODELS[type];
  if (!Model) throw new Error(`Invalid master data type: ${type}`);

  const { id, ...data } = input;
  const filter = id ? withTenant({ _id: id }) : withTenant({ name: data.name });

  return await Model.findOneAndUpdate(
    filter,
    { $set: { ...data, ...withTenant({}) } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
};

exports.deleteMasterData = async (type, id) => {
  const Model = MASTER_DATA_MODELS[type];
  if (!Model) throw new Error(`Invalid master data type: ${type}`);
  return await Model.findOneAndDelete(withTenant({ _id: id }));
};
