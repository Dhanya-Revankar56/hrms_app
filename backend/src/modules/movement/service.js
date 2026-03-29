const Movement = require("./model");
const Settings = require("../settings/model");
const Leave = require("../leave/model");
const Holiday = require("../holiday/model");

/**
 * Validates movement request against institutional settings
 */
const checkMovementRules = async (institution_id, employee_id, movement_date, out_time, in_time) => {
  const settings = await Settings.findOne({ institution_id }).lean();
  if (!settings || !settings.movement_settings || !settings.movement_settings.limit_enabled) {
    return; // No rules to enforce
  }

  const ms = settings.movement_settings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const moveDate = new Date(movement_date);
  moveDate.setHours(0, 0, 0, 0);

  // 1. Leave Overlap Check
  const overlappingLeave = await Leave.findOne({
    employee_id,
    status: { $in: ["approved", "pending"] },
    from_date: { $lte: moveDate },
    to_date: { $gte: moveDate }
  }).lean();

  if (overlappingLeave) {
    throw new Error(`Cannot apply for movement on ${moveDate.toDateString()} because you have an ${overlappingLeave.status} leave for this day.`);
  }

  // 2. Holiday Check
  const holiday = await Holiday.findOne({
    institution_id,
    date: { 
      $gte: new Date(moveDate.getFullYear(), moveDate.getMonth(), moveDate.getDate()),
      $lt: new Date(moveDate.getFullYear(), moveDate.getMonth(), moveDate.getDate() + 1)
    },
    is_active: true
  }).lean();

  if (holiday) {
    throw new Error(`Cannot apply for movement on ${moveDate.toDateString()} because it is a holiday: ${holiday.name}.`);
  }

  // 3. Lead Time Check (only enforce if advance notice is required)
  if (ms.days_before_apply > 0) {
    const daysDiff = Math.floor((moveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < ms.days_before_apply) {
      throw new Error(`Movement must be applied at least ${ms.days_before_apply} days in advance.`);
    }
  }

  // 2. Duration Check
  if (out_time && in_time) {
    const [h1, m1] = out_time.split(':').map(Number);
    const [h2, m2] = in_time.split(':').map(Number);
    const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (duration > ms.max_duration_mins) {
      throw new Error(`Movement duration exceeds the maximum allowed limit of ${ms.max_duration_mins} minutes.`);
    }
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
  } else {
    startOfPeriod = new Date(moveDate.getFullYear(), 0, 1);
    endOfPeriod = new Date(moveDate.getFullYear(), 11, 31);
  }

  startOfPeriod.setHours(0, 0, 0, 0);
  endOfPeriod.setHours(23, 59, 59, 999);

  const count = await Movement.countDocuments({
    institution_id,
    employee_id,
    movement_date: { $gte: startOfPeriod, $lte: endOfPeriod },
    status: { $ne: "rejected" }
  });

  if (count >= ms.limit_count) {
    throw new Error(`You have reached the movement limit for this ${ms.limit_frequency.toLowerCase()} (${ms.limit_count}).`);
  }
};

exports.listMovements = async ({ institution_id, employee_id, status, movement_type, pagination }) => {
  const filter = { institution_id };
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = status;
  if (movement_type) filter.movement_type = movement_type;

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

exports.getMovementById = async (id, institution_id) => {
  const rec = await Movement.findOne({ _id: id, institution_id }).populate("employee").lean();
  if (!rec) throw new Error("Movement record not found");
  return rec;
};

exports.createMovement = async (data) => {
  // Enforce rules before creation
  await checkMovementRules(
    data.institution_id, 
    data.employee_id, 
    data.movement_date, 
    data.out_time, 
    data.in_time
  );

  const record = new Movement(data);
  const saved = await record.save();
  return saved.toObject();
};

exports.updateMovement = async (id, data, institution_id) => {
  const existing = await Movement.findOne({ _id: id, institution_id });
  if (!existing) throw new Error("Movement record not found");

  // Merge new data
  const updateData = { ...data };

  // Calculate overall status based on flatter logic
  // Logic: 
  // 1. Any rejection -> Rejected
  // 2. Either approved -> Approved (if no rejection)
  // 3. Otherwise -> Pending
  
  const deptStatus = data.dept_admin_status || existing.dept_admin_status;
  const admStatus = data.admin_status || existing.admin_status;

  // Logic:
  // 1. Any rejection by either HOD or Admin -> Overall Rejected
  // 2. Admin Approval -> Overall Approved (Admin is final authority)
  // 3. HOD Approval (without Admin response) -> Still Overall Pending (Waiting for Admin)
  // 4. Otherwise -> Pending

  if (data.status === "cancelled") {
    updateData.status = "cancelled";
  } else if (data.status === "completed" || (existing.status === "completed" && !data.status)) {
    updateData.status = "completed";
  } else if (deptStatus === "rejected" || admStatus === "rejected") {
    updateData.status = "rejected";
  } else if (admStatus === "approved") {
    updateData.status = "approved";
  } else {
    updateData.status = "pending";
  }

  const updated = await Movement.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("employee").lean();

  return updated;
};

exports.deleteMovement = async (id, institution_id) => {
  const deleted = await Movement.findOneAndDelete({ _id: id, institution_id });
  if (!deleted) throw new Error("Movement record not found");
  return { success: true, message: "Movement record deleted successfully" };
};
