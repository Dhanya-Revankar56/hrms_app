const Movement = require("./model");
const Settings = require("../settings/model");
const Leave = require("../leave/model");
const Holiday = require("../holiday/model");
const Employee = require("../employee/model");
const AuditLog = require("../audit/model");
const { withTenant } = require("../../utils/tenantUtils");

/**
 * Validates movement request against institutional settings
 */
const checkMovementRules = async (employee_id, movement_date, out_time, in_time) => {
  const settings = await Settings.findOne(withTenant({})).lean();
  if (!settings || !settings.movement_settings || !settings.movement_settings.limit_enabled) {
    return; // No rules to enforce
  }

  const ms = settings.movement_settings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const moveDate = new Date(movement_date);
  moveDate.setHours(0, 0, 0, 0);

  // 1. Leave Overlap Check
  const overlappingLeave = await Leave.findOne(withTenant({
    employee_id,
    status: { $in: ["approved", "pending"] },
    from_date: { $lte: moveDate },
    to_date: { $gte: moveDate }
  })).lean();

  if (overlappingLeave) {
    throw new Error(`Cannot apply for movement on ${moveDate.toDateString()} because you have an ${overlappingLeave.status} leave for this day.`);
  }

  // 2. Holiday Check
  const holiday = await Holiday.findOne(withTenant({
    date: { 
      $gte: new Date(moveDate.getFullYear(), moveDate.getMonth(), moveDate.getDate()),
      $lt: new Date(moveDate.getFullYear(), moveDate.getMonth(), moveDate.getDate() + 1)
    },
    is_active: true
  })).lean();

  if (holiday) {
    throw new Error(`Cannot apply for movement on ${moveDate.toDateString()} because it is a holiday: ${holiday.name}.`);
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

  const count = await Movement.countDocuments(withTenant({
    employee_id,
    movement_date: { $gte: startOfPeriod, $lte: endOfPeriod },
    status: { $ne: "rejected" }
  }));

  if (count >= ms.limit_count) {
    throw new Error(`You have reached the movement limit for this ${ms.limit_frequency.toLowerCase()} (${ms.limit_count}).`);
  }
};

exports.listMovements = async ({ employee_id, status, movement_type, department, pagination }) => {
  const filter = withTenant({});
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = status;
  if (movement_type) filter.movement_type = movement_type;

  if (department) {
    const employees = await Employee.find(withTenant({ 
      "work_detail.department": department 
    })).select("_id").lean();
    filter.employee_id = { $in: employees.map(e => e._id) };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Movement.find(filter).sort({ movement_date: -1 }).skip(skip).limit(limit).populate("employee").lean(),
    Movement.countDocuments(filter)
  ]);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount
    }
  };
};

exports.getMovementById = async (id) => {
  const filter = withTenant({ _id: id });
  const rec = await Movement.findOne(filter).populate("employee").lean();
  if (!rec) throw new Error("Movement record not found");
  return rec;
};

exports.createMovement = async (data, context) => {
  const filter = withTenant({});
  
  await checkMovementRules(
    data.employee_id, 
    data.movement_date, 
    data.out_time, 
    data.in_time
  );

  const record = new Movement({ ...data, ...filter });
  const saved = await record.save();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "MOVEMENT_APPLY",
    user_id: context?.user?.id || data.user_id,
    tenant_id: filter.tenant_id,
    metadata: { movement_id: saved._id, date: data.movement_date }
  });

  return saved.toObject();
};

exports.updateMovement = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const updated = await Movement.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new Error("Movement record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "MOVEMENT_UPDATED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { movement_id: id, status: updated.status }
  });

  return updated;
};

exports.deleteMovement = async (id, context) => {
  const filter = withTenant({ _id: id });
  const deleted = await Movement.findOneAndDelete(filter).lean();
  if (!deleted) throw new Error("Movement record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "MOVEMENT_DELETED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { movement_id: id }
  });

  return { success: true, message: "Movement record deleted successfully" };
};
