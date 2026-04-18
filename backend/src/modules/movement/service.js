const Movement = require("./model");
const Settings = require("../settings/model");
const Leave = require("../leave/model");
const Holiday = require("../holiday/model");
const Employee = require("../employee/model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");
const { getTenantId } = require("../../middleware/tenantContext");

/**
 * Validates movement request against institutional settings
 */
const checkMovementRules = async (
  employee_id,
  movement_date,
  out_time,
  in_time,
) => {
  const settings = await Settings.findOne(withTenant({})).lean();
  if (
    !settings ||
    !settings.movement_settings ||
    !settings.movement_settings.limit_enabled
  ) {
    return; // No rules to enforce
  }

  const ms = settings.movement_settings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const moveDate = new Date(movement_date);
  moveDate.setHours(0, 0, 0, 0);

  // 1. Leave Overlap Check
  const overlappingLeave = await Leave.findOne(
    withTenant({
      employee_id,
      status: { $in: ["approved", "pending"] },
      from_date: { $lte: moveDate },
      to_date: { $gte: moveDate },
    }),
  ).lean();

  if (overlappingLeave) {
    throw new Error(
      `Cannot apply for movement on ${moveDate.toDateString()} because you have an ${overlappingLeave.status} leave for this day.`,
    );
  }

  // 2. Holiday Check
  const holiday = await Holiday.findOne(
    withTenant({
      date: {
        $gte: new Date(
          moveDate.getFullYear(),
          moveDate.getMonth(),
          moveDate.getDate(),
        ),
        $lt: new Date(
          moveDate.getFullYear(),
          moveDate.getMonth(),
          moveDate.getDate() + 1,
        ),
      },
      is_active: true,
    }),
  ).lean();

  if (holiday) {
    throw new Error(
      `Cannot apply for movement on ${moveDate.toDateString()} because it is a holiday: ${holiday.name}.`,
    );
  }

  // 3. Frequency Limit Check
  let startOfPeriod = new Date(moveDate);
  let endOfPeriod = new Date(moveDate);

  if (ms.limit_frequency === "Weekly") {
    const day = moveDate.getDay();
    startOfPeriod.setDate(moveDate.getDate() - day);
    endOfPeriod.setDate(moveDate.getDate() + (6 - day));
  } else if (ms.limit_frequency === "Monthly") {
    startOfPeriod = new Date(moveDate.getFullYear(), moveDate.getMonth(), 1);
    endOfPeriod = new Date(moveDate.getFullYear(), moveDate.getMonth() + 1, 0);
  }

  startOfPeriod.setHours(0, 0, 0, 0);
  endOfPeriod.setHours(23, 59, 59, 999);

  const count = await Movement.countDocuments(
    withTenant({
      employee_id,
      movement_date: { $gte: startOfPeriod, $lte: endOfPeriod },
      status: { $ne: "rejected" },
    }),
  );

  if (count >= ms.limit_count) {
    throw new Error(
      `You have reached the movement limit for this ${ms.limit_frequency.toLowerCase()} (${ms.limit_count}).`,
    );
  }

  // 4. Duration Check
  if (out_time && in_time) {
    const [oh, om] = out_time.split(":").map(Number);
    const [ih, im] = in_time.split(":").map(Number);
    const durationMins = ih * 60 + im - (oh * 60 + om);
    if (durationMins > (ms.max_duration_mins || 60)) {
      throw new Error(
        `Movement duration cannot exceed ${ms.max_duration_mins || 60} minutes. Your request is ${durationMins} minutes.`,
      );
    }
  }
};

exports.listMovements = async ({
  employee_id,
  status,
  movement_type,
  department,
  pagination,
}) => {
  const filter = withTenant({});
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = { $regex: new RegExp(`^${status}$`, "i") };
  if (movement_type) filter.movement_type = movement_type;

  if (department) {
    const employees = await Employee.find(
      withTenant({
        "work_detail.department": department,
      }),
    )
      .select("_id")
      .lean();
    filter.employee_id = { $in: employees.map((e) => e._id) };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Movement.find(filter)
      .sort({ movement_date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employee")
      .lean(),
    Movement.countDocuments(filter),
  ]);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount,
    },
  };
};

exports.getMovementById = async (id) => {
  const filter = withTenant({ _id: id });
  const rec = await Movement.findOne(filter).populate("employee").lean();
  if (!rec) throw new Error("Movement record not found");
  return rec;
};

exports.createMovement = async (data, context) => {
  const tenantId = getTenantId();

  // 1. Resolve Employee (record ID or User ID)
  const employee = await Employee.findOne(
    withTenant({
      $or: [{ _id: data.employee_id }, { user_id: data.employee_id }],
    }),
  );
  if (!employee) throw new Error("Employee not found");

  // Normalize to actual record ID
  const employee_id = employee._id;
  data.employee_id = employee_id;

  await checkMovementRules(
    employee_id,
    data.movement_date,
    data.out_time,
    data.in_time,
  );

  const record = new Movement({ ...data, tenant_id: tenantId });
  const saved = await record.save();

  const savedObj = saved.toObject();

  // Log to EventRegister via service (replacing direct AuditLog.create to avoid duplicates)
  const emp = await Employee.findById(savedObj.employee_id).lean();
  const empName = emp ? emp.name : "Employee";
  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: empName,
    user_role: context.user?.role || "EMPLOYEE",
    module_name: "Movement Register",
    action_type: "CREATED",
    module: "Movement Register",
    record_id: savedObj._id,
    description: `${empName} applied for movement`,
  });

  return savedObj;
};

/**
 * Logic to compute the overall movement status based on individual approvals
 */
const computeMovementStatus = (movement) => {
  // If status is already terminal (completed/cancelled), keep it
  if (["completed", "cancelled"].includes(movement.status))
    return movement.status;

  const ds = (movement.dept_admin_status || "pending").toLowerCase();
  const as = (movement.admin_status || "pending").toLowerCase();

  if (ds === "rejected" || as === "rejected") return "rejected";
  if (ds === "approved" || as === "approved") return "approved";
  return "pending";
};

exports.updateMovement = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const movement = await Movement.findOne(filter);
  if (!movement) throw new Error("Movement record not found");

  // Apply updates from incoming data
  Object.keys(data).forEach((key) => {
    movement[key] = data[key];
    if (key === "dept_admin_status") movement.dept_admin_date = new Date();
    if (key === "admin_status") movement.admin_date = new Date();
  });

  // Sync overall status
  movement.status = computeMovementStatus(movement);

  const updated = await movement.save();

  // 🛡 Audit Log: Only log if time changed, cancelled, or status changed
  const timeChanged = data.out_time || data.in_time;
  const wasCancelled = data.status === "cancelled";
  const statusChanged =
    data.dept_admin_status ||
    data.admin_status ||
    (data.status && data.status !== movement.status);

  if (timeChanged || wasCancelled || statusChanged) {
    const emp = await Employee.findById(updated.employee_id).lean();
    const empName = emp ? emp.name : "Employee";
    const user_id = getUserIdFromCtx(context);
    const user_role = context.user?.role || "ADMIN";

    let desc = wasCancelled
      ? `${empName}'s movement record has been deleted`
      : "movement record updated";

    if (data.dept_admin_status || data.admin_status) {
      const newStatus = data.dept_admin_status || data.admin_status;
      desc = `${empName}'s movement has been ${newStatus.toLowerCase()} by ${user_role}`;
    }

    // Log to EventRegister (replacing direct AuditLog.create to avoid duplicates)
    const eventLogService = require("../eventLog/service");
    await eventLogService.logEvent({
      user_id,
      user_name: context.user?.name || "Admin",
      user_role,
      module_name: "Movement Register",
      action_type: "UPDATED",
      module: "Movement Register",
      record_id: id,
      description: wasCancelled
        ? `${empName} movement has been cancelled`
        : desc,
    });
  }

  return updated.toObject();
};

exports.deleteMovement = async (id, context) => {
  const filter = withTenant({ _id: id });
  const deleted = await Movement.findOneAndDelete(filter).lean();
  if (!deleted) throw new Error("Movement record not found");

  // Also log to EventRegister (replacing direct AuditLog.create to avoid duplicates)
  const emp = await Employee.findById(deleted.employee_id).lean();
  const empName = emp ? emp.name : "Employee";
  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: "User",
    user_role: context.user?.role || "ADMIN",
    module_name: "Movement Register",
    action_type: "UPDATED",
    module: "Movement Register",
    record_id: id,
    description: `${empName} movement has been cancelled`,
  });

  return { success: true, message: "Movement record deleted successfully" };
};
