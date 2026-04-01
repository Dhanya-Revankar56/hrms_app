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

  // Event Log — Business Event: Settings Updated
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "settings",
    action_type: "UPDATED",
    record_id: updated._id.toString(),
    description: "Attendance settings updated",
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
  let isNew = false;
  let existing = null;
  
  if (id) {
    existing = await Model.findOne({ _id: id, institution_id }).lean();
    result = await Model.findOneAndUpdate(
      { _id: id, institution_id },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    if (!result) throw new Error(`Item with id ${id} not found in ${field}`);
  } else {
    isNew = true;
    result = await Model.create({ ...data, institution_id });
    result = result.toObject();
  }

  // Event Log — Business Event: Master Data Changed
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "settings",
    action_type: isNew ? "CREATED" : "UPDATED",
    record_id: result._id.toString(),
    description: `${result.name || result.code} ${isNew ? "created" : "updated"}`,
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
    // Event Log — Business Event: Master Data Deleted
    await eventLogService.logEvent({
      institution_id,
      user_name: "Admin",
      user_role: "HR Administrator",
      module_name: "settings",
      action_type: "DELETED",
      record_id: id,
      description: `${deleted.name || deleted.code} deleted`,
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
