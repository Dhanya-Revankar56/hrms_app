const Settings = require("./model");
const Department = require("./department.model");
const Designation = require("./designation.model");
const LeaveType = require("./leaveType.model");
const EmployeeCategory = require("./employeeCategory.model");
const EmployeeType = require("./employeeType.model");
const eventLogService = require("../eventLog/service");

const modelMap = {
  departments: Department,
  designations: Designation,
  leave_types: LeaveType,
  employee_categories: EmployeeCategory,
  employee_types: EmployeeType,
};

exports.getSettings = async (institution_id) => {
  let s = await Settings.findOne({ institution_id }).lean();
  if (!s) {
    s = await Settings.create({ institution_id });
    return s.toObject();
  }
  return s;
};

exports.upsertSettings = async (institution_id, data) => {
  const existing = await Settings.findOne({ institution_id }).lean();
  const updated = await Settings.findOneAndUpdate(
    { institution_id },
    { $set: { ...data, institution_id } },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "settings",
    action_type: "UPDATE",
    record_id: updated._id.toString(),
    description: "Institutional settings updated.",
    old_data: existing,
    new_data: updated
  });

  return updated;
};

exports.upsertMasterData = async (institution_id, field, input) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);

  const { id, ...data } = input;
  let result;
  let action = "CREATE";
  let existing = null;
  
  if (id) {
    action = "UPDATE";
    existing = await Model.findOne({ _id: id, institution_id }).lean();
    result = await Model.findOneAndUpdate(
      { _id: id, institution_id },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    if (!result) throw new Error(`Item with id ${id} not found in ${field}`);
  } else {
    result = await Model.create({ ...data, institution_id });
    result = result.toObject();
  }

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "settings",
    action_type: action,
    record_id: result._id.toString(),
    description: `${action === "CREATE" ? "New" : "Updated"} master data in ${field}: ${result.name || result.code}`,
    old_data: existing,
    new_data: result
  });

  return { ...result, id: result._id.toString() };
};

exports.deleteMasterData = async (institution_id, field, id) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);

  const deleted = await Model.findOneAndDelete({ _id: id, institution_id }).lean();
  if (deleted) {
    // Audit Log
    await eventLogService.logEvent({
      institution_id,
      user_name: "Admin",
      user_role: "HR Administrator",
      module_name: "settings",
      action_type: "DELETE",
      record_id: id,
      description: `Deleted master data from ${field}: ${deleted.name || deleted.code}`,
      old_data: deleted
    });
  }
  return !!deleted;
};

exports.listMasterData = async (institution_id, field) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);
  const query = Model.find({ institution_id });
  return await query.lean();
};
