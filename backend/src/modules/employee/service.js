const Employee = require("./model");
const User = require("../auth/user.model");
const AuditLog = require("../audit/model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");
const { getTenantId } = require("../../middleware/tenantContext");
const counterService = require("../counter/service");
const Relieving = require("../relieving/model");

/**
 * The Service layer handles all business logic.
 * These are the "functions" that were in the functions/ folder before.
 * They can be reused by different resolvers or even external triggers.
 */

exports.listEmployees = async ({ status, department, search, pagination }) => {
  const filter = withTenant({});
  if (status) {
    filter.status = status;
  }

  // 🛡 Hide archived/relieved employees from the main management list
  filter.is_active = { $ne: false };
  if (department) filter["work_detail.department"] = department;
  if (search) {
    const q = { $regex: search, $options: "i" };
    filter.$or = [
      { name: q },
      { first_name: q },
      { last_name: q },
      { employee_id: q },
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
    Employee.countDocuments({ ...filter, app_status: "on-leave" }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    },
    activeCount,
    onLeaveCount,
  };
};

exports.getEmployeeById = async (id) => {
  // Support both Employee _id and User user_id for flexibility
  const filter = withTenant({
    $or: [{ _id: id }, { user_id: id }],
  });

  const emp = await Employee.findOne(filter)
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
    const rawRole = result.app_role.toLowerCase().trim();
    if (rawRole === "head of department" || rawRole === "hod") {
      result.app_role = "HEAD OF DEPARTMENT";
    } else {
      result.app_role = rawRole.toUpperCase();
    }
  }

  if (result.personal_detail) {
    result.personal_detail = { ...result.personal_detail };
    // Convert Date strings
    if (
      !result.personal_detail.date_of_birth ||
      result.personal_detail.date_of_birth === "" ||
      result.personal_detail.date_of_birth === "Invalid Date"
    ) {
      delete result.personal_detail.date_of_birth;
    } else {
      result.personal_detail.date_of_birth = new Date(
        result.personal_detail.date_of_birth,
      );
    }
    // Remove empty strings for strict enums
    if (result.personal_detail.gender === "")
      delete result.personal_detail.gender;
    if (result.personal_detail.marital_status === "")
      delete result.personal_detail.marital_status;
  }

  if (result.work_detail) {
    result.work_detail = { ...result.work_detail };
    // Convert Date strings
    if (
      !result.work_detail.date_of_joining ||
      result.work_detail.date_of_joining === "" ||
      result.work_detail.date_of_joining === "Invalid Date"
    ) {
      delete result.work_detail.date_of_joining;
    } else {
      result.work_detail.date_of_joining = new Date(
        result.work_detail.date_of_joining,
      );
    }
    // Remove empty strings for strict enums
    if (result.work_detail.employee_type === "")
      delete result.work_detail.employee_type;

    // Normalize IDs: if empty string, set to null to avoid cast errors
    if (result.work_detail.designation === "")
      result.work_detail.designation = null;
    if (result.work_detail.department === "")
      result.work_detail.department = null;
    if (result.work_detail.reporting_to === "")
      result.work_detail.reporting_to = null;
  }

  // Bank details normalization
  if (result.bank_detail && Array.isArray(result.bank_detail)) {
    result.bank_detail = result.bank_detail.map((bank) => {
      const b = { ...bank };
      if (b.bank_type === "") delete b.bank_type;
      return b;
    });
  }

  return result;
};

exports.createEmployee = async (data, context) => {
  const normalized = normalizeData(data);
  const tenant_id = getTenantId();

  if (!tenant_id)
    throw new Error("Tenant context is required for employee creation.");

  // 🛡 1. Atomic User (Auth) Creation
  const existingUser = await User.findOne({
    email: normalized.user_email.toLowerCase(),
    tenant_id,
  }).setOptions({ skipTenant: true });
  if (existingUser)
    throw new Error(
      `User with email ${normalized.user_email} already exists in this institution.`,
    );

  const Tenant = require("../tenant/model");
  const tenant = await Tenant.findById(tenant_id).setOptions({
    skipTenant: true,
  });
  if (!tenant || !tenant.code) {
    throw new Error(
      "Critical Configuration Error: Active institution code not found.",
    );
  }

  const user = new User({
    email: normalized.user_email.toLowerCase(),
    password: normalized.password || "reset123", // Default password
    role: (normalized.app_role || "EMPLOYEE").toUpperCase(),
    tenant_id,
    tenant_code: tenant.code.toUpperCase(),
  });
  const savedUser = await user.save();

  try {
    // 🏷 2. Employee Profile Creation
    if (!normalized.employee_id) {
      const nextSeq = await counterService.getNextID(tenant_id, "employee");
      normalized.employee_id = `EMP-${String(nextSeq).padStart(3, "0")}`;
    }

    const emp = new Employee({
      ...normalized,
      name:
        normalized.name ||
        `${normalized.first_name || ""} ${normalized.last_name || ""}`.trim(),
      user_id: savedUser._id,
      tenant_id,
    });
    const savedEmp = await emp.save();

    // 🛡 3. Audit Log
    await AuditLog.create({
      action: "CREATED",
      module: "Employee Onboarding",
      user_id: getUserIdFromCtx(context) || savedUser._id,
      tenant_id,
      metadata: {
        employee_id: savedEmp._id,
        employee_code: savedEmp.employee_id,
        name: emp.name,
        email: normalized.user_email,
        description: `${emp.name} joined the organization`,
      },
    });

    return savedEmp.toObject();
  } catch (error) {
    // 🛡 Rollback pseudo-transaction
    await User.deleteOne({ _id: savedUser._id });
    throw error;
  }
};

exports.updateEmployee = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const existing = await Employee.findOne(filter).lean();
  if (!existing) throw new Error("Employee not found or access denied");

  const normalized = normalizeData(data);

  // 🛡 1. Sync Authentication Data if changed
  if (normalized.user_email || normalized.app_role) {
    const userUpdate = {};
    if (normalized.user_email)
      userUpdate.email = normalized.user_email.toLowerCase();
    if (normalized.app_role)
      userUpdate.role = normalized.app_role.toUpperCase();

    await User.updateOne({ _id: existing.user_id }, { $set: userUpdate });
  }

  // 🏷 2. Update Business Profile
  const updated = await Employee.findOneAndUpdate(
    filter,
    { $set: normalized },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) throw new Error("Employee not found or access denied");

  // 🛡 3. Audit Log
  await AuditLog.create({
    action: "UPDATED",
    module: "Employee Management",
    user_id: getUserIdFromCtx(context),
    tenant_id: existing.tenant_id,
    metadata: {
      employee_id: id,
      changes: Object.keys(data),
      description: `${updated.name} details were updated`,
    },
  });

  // Also log to EventRegister via service for consistency if needed,
  // but AuditLog.create is sufficient since listEventLogs reads it.
  // I will just make the description cleaner.

  return updated;
};

exports.deleteEmployee = async (id, context) => {
  const filter = withTenant({ _id: id });

  const emp = await Employee.findOne(filter);
  if (!emp) throw new Error("Employee not found or access denied");

  // 🛡 1. Atomic Deactivation
  await Promise.all([
    Employee.updateOne(
      { _id: id },
      { $set: { is_active: false, status: "inactive" } },
    ),
    User.updateOne({ _id: emp.user_id }, { $set: { isActive: false } }),
  ]);

  // 🛡 2. Audit Log
  await AuditLog.create({
    action: "DELETED",
    module: "Employee Management",
    user_id: getUserIdFromCtx(context),
    tenant_id: emp.tenant_id,
    metadata: {
      employee_id: id,
      name: emp.name,
      description: `${emp.name} has been deleted`,
    },
  });

  return {
    success: true,
    message: "Employee and associated account archived successfully",
  };
};

exports.reHireEmployee = async (id, context) => {
  const filter = withTenant({ _id: id });

  const emp = await Employee.findOne(filter);
  if (!emp) throw new Error("Employee not found or access denied");

  // 🛡 1. Atomic Re-activation
  await Promise.all([
    Employee.updateOne(
      { _id: id },
      {
        $set: {
          is_active: true,
          status: "active",
          app_status: "active",
        },
        $unset: {
          relieved_at: 1,
          relieved_reason: 1,
        },
      },
    ),
    User.updateOne({ _id: emp.user_id }, { $set: { isActive: true } }),
    Relieving.deleteOne(withTenant({ employee_id: id })),
  ]);

  // 🛡 2. Audit Log
  await AuditLog.create({
    action: "REJOINED",
    module: "Employee Management",
    user_id: getUserIdFromCtx(context),
    tenant_id: emp.tenant_id,
    metadata: {
      employee_id: id,
      name: emp.name,
      description: `${emp.name} rejoined the organization`,
    },
  });

  return await Employee.findOne(filter).lean();
};
