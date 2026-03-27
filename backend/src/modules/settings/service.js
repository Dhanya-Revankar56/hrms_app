const Settings = require("./model");
const Department = require("./department.model");
const Designation = require("./designation.model");
const LeaveType = require("./leaveType.model");
const EmployeeCategory = require("./employeeCategory.model");
const EmployeeType = require("./employeeType.model");

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
  const updated = await Settings.findOneAndUpdate(
    { institution_id },
    { $set: { ...data, institution_id } },
    { new: true, upsert: true, runValidators: true }
  ).lean();
  return updated;
};

exports.upsertMasterData = async (institution_id, field, input) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);

  const { id, ...data } = input;
  let result;
  
  if (id) {
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

  return { ...result, id: result._id.toString() };
};

exports.deleteMasterData = async (institution_id, field, id) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);

  const deleted = await Model.findOneAndDelete({ _id: id, institution_id });
  return !!deleted;
};

exports.listMasterData = async (institution_id, field) => {
  const Model = modelMap[field];
  if (!Model) throw new Error(`Invalid master data field: ${field}`);
  const query = Model.find({ institution_id });
  return await query.lean();
};
