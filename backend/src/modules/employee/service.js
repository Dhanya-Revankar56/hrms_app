const Employee = require("./model");
const counterService = require("../counter/service");

/**
 * The Service layer handles all business logic.
 * These are the "functions" that were in the functions/ folder before.
 * They can be reused by different resolvers or even external triggers.
 */

exports.listEmployees = async ({ institution_id, status, department, search, pagination }) => {
  const filter = { institution_id };
  if (status === "relieved") {
    filter.app_status = "relieved";
  } else {
    filter.is_active = { $ne: false };
    if (status) filter.app_status = status;
    else filter.app_status = { $ne: "relieved" };
  }
  if (department) filter["work_detail.department"] = department;
  if (search) {
    filter.$or = [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { employee_id: { $regex: search, $options: "i" } },
      { user_email: { $regex: search, $options: "i" } },
    ];
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount, activeCount, onLeaveCount] = await Promise.all([
    Employee.find(filter)
      .populate("work_detail.department")
      .populate("work_detail.designation")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
    Employee.countDocuments({ ...filter, app_status: "active" }),
    Employee.countDocuments({ ...filter, app_status: "on-leave" })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages
    },
    activeCount,
    onLeaveCount
  };
};

exports.getEmployeeById = async (id, institution_id) => {
  const emp = await Employee.findOne({ _id: id, institution_id })
    .populate("work_detail.department")
    .populate("work_detail.designation")
    .lean();
  if (!emp) throw new Error("Employee not found");
  return emp;
};

const normalizeData = (data) => {
  if (!data) return data;
  const result = { ...data };
  
  // Normalize Role
  if (result.app_role) {
    result.app_role = result.app_role.toLowerCase();
  }

  if (result.personal_detail) {
    result.personal_detail = { ...result.personal_detail };
    // Convert Date strings
    if (!result.personal_detail.date_of_birth || result.personal_detail.date_of_birth === "" || result.personal_detail.date_of_birth === "Invalid Date") {
      delete result.personal_detail.date_of_birth;
    } else {
      result.personal_detail.date_of_birth = new Date(result.personal_detail.date_of_birth);
    }
    // Remove empty strings for strict enums
    if (result.personal_detail.gender === "") delete result.personal_detail.gender;
    if (result.personal_detail.marital_status === "") delete result.personal_detail.marital_status;
  }
  
  if (result.work_detail) {
    result.work_detail = { ...result.work_detail };
    // Convert Date strings
    if (!result.work_detail.date_of_joining || result.work_detail.date_of_joining === "" || result.work_detail.date_of_joining === "Invalid Date") {
      delete result.work_detail.date_of_joining;
    } else {
      result.work_detail.date_of_joining = new Date(result.work_detail.date_of_joining);
    }
    // Remove empty strings for strict enums
    if (result.work_detail.employee_type === "") delete result.work_detail.employee_type;
    
    // Normalize IDs: if empty string, set to null to avoid cast errors
    if (result.work_detail.designation === "") result.work_detail.designation = null;
    if (result.work_detail.department === "") result.work_detail.department = null;
    if (result.work_detail.reporting_to === "") result.work_detail.reporting_to = null;
  }

  // Bank details normalization
  if (result.bank_detail && Array.isArray(result.bank_detail)) {
    result.bank_detail = result.bank_detail.map(bank => {
      const b = { ...bank };
      if (b.bank_type === "") delete b.bank_type;
      return b;
    });
  }

  return result;
};

exports.createEmployee = async (data) => {
  const normalized = normalizeData(data);
  
  // Atomic ID Generation
  if (!normalized.employee_id) {
    const nextSeq = await counterService.getNextID(normalized.institution_id, "employee");
    normalized.employee_id = `EMP-${String(nextSeq).padStart(3, "0")}`;
  }

  const emp = new Employee(normalized);
  const saved = await emp.save();
  return saved.toObject();
};

exports.updateEmployee = async (id, data, institution_id) => {
  const normalized = normalizeData(data);
  const updated = await Employee.findOneAndUpdate(
    { _id: id, institution_id, is_active: { $ne: false } },
    { $set: normalized },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw new Error("Employee not found or access denied");
  return updated;
};

exports.deleteEmployee = async (id, institution_id) => {
  const updated = await Employee.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: { is_active: false } },
    { new: true }
  );
  if (!updated) throw new Error("Employee not found or access denied");
  return { success: true, message: "Employee archived successfully" };
};
