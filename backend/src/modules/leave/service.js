const Leave = require("./model");
const { withTenant, applyTenantFilter } = require("../../utils/tenantUtils");
const { getTenantId } = require("../../middleware/tenantContext");
const AuditLog = require("../audit/model");
const LeaveBalance = require("./leaveBalance");
const Settings = require("../settings/model");
const Employee = require("../employee/model");
const LeaveType = require("../settings/leaveType.model");
const Attendance = require("../attendance/model");
const Holiday = require("../holiday/model");

/**
 * Helper: Fetch all holidays for an institution between two dates
 */
const getHolidaysInRange = async (from, to) => {
  return await Holiday.find({
    is_active: true,
    date: { $gte: from, $lte: to }
  }).lean();
};

/**
 * Helper: Check if a date is a non-working day or holiday
 * Uses working_days from Settings and live Holiday collection
 */
const isHolidayOrSunday = (date, settings, publicHolidays = []) => {
  const d = new Date(date);
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  
  // 1. Check if it's a configured working day (if not in list, it's a weekend/off)
  const isOffDay = !settings.working_days.includes(dayName);
  
  // 2. Check against live Holiday collection
  const isExplicitHoliday = publicHolidays.some(h => 
    new Date(h.date).toDateString() === d.toDateString()
  );
  
  return isOffDay || isExplicitHoliday;
};

/**
 * Helper: Calculate working days in range
 */
const calculateWorkingDays = (from, to, settings, options = {}, publicHolidays = []) => {
  const { weekends_covered = false, holiday_covered = false } = options;
  let count = 0;
  const current = new Date(from);
  const end = new Date(to);
  
  while (current <= end) {
    const isHoliday = isHolidayOrSunday(current, settings, publicHolidays);
    
    if (!isHoliday) {
      count++;
    } else {
      const d = new Date(current);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const isWeekend = !settings.working_days.includes(dayName);
      
      if (isWeekend && weekends_covered) count++;
      else if (!isWeekend && holiday_covered) count++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Helper: Compute final status based on approvals
 */
const computeFinalStatus = (approvals) => {
  // 1. If any one rejects, it's rejected (overrides approvals)
  if (approvals.some(a => a.status === "rejected")) return "rejected";
  
  // 2. If any one approves, it's approved (now it allows partial approval to suffice)
  if (approvals.some(a => a.status === "approved")) return "approved";
  
  // 3. Otherwise pending
  return "pending";
};

exports.listLeaves = async ({ employee_id, status, leave_type, department, search, month, year, pagination }) => {
  const filter = withTenant({});
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = status;
  if (leave_type) filter.leave_type = leave_type;

  if (department || search) {
    const employeeFilter = withTenant({});
    if (department) employeeFilter["work_detail.department"] = department;
    if (search) {
      const q = { $regex: search, $options: "i" };
      employeeFilter.$or = [
        { first_name: q },
        { last_name: q },
        { employee_id: q }
      ];
    }

    const employees = await Employee.find(employeeFilter).select("_id").lean();
    const employeeIds = employees.map(e => e._id.toString());
    
    if (filter.employee_id) {
       if (!employeeIds.includes(filter.employee_id)) {
         filter.employee_id = { $in: [] }; 
       }
    } else {
       filter.employee_id = { $in: employeeIds };
    }
  }

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    filter.from_date = { $lte: endDate };
    filter.to_date = { $gte: startDate };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  // For the aggregate counts, we only want the basic filter (tenant_id)
  // to reflect "All Time" statistics as labeled in the UI.
  const baseFilter = withTenant({});
  if (employee_id) baseFilter.employee_id = employee_id;

  const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    Leave.countDocuments(filter),
    Leave.countDocuments({ ...baseFilter, status: { $in: ["pending", "Pending"] } }),
    Leave.countDocuments({ ...baseFilter, status: { $in: ["approved", "Approved"] } }),
    Leave.countDocuments({ ...baseFilter, status: { $in: ["rejected", "Rejected"] } })
  ]);

  const leaves = await Leave.find(filter)
    .sort({ from_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  const processedItems = leaves.map(l => {
    // 1. Re-compute status based on approvals for UI consistency (especially for legacy data)
    let effectiveStatus = l.status;
    if (l.status?.toLowerCase() !== "cancelled") {
      effectiveStatus = computeFinalStatus(l.approvals || []);
    }

    // 2. Dynamically mark as 'closed' if approved and past to_date
    if (effectiveStatus === "approved" && new Date(l.to_date) < now) {
      effectiveStatus = "closed";
    }
    
    return { ...l, status: effectiveStatus };
  });

  return {
    items: processedItems,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalCount / limit)
    },
    approvedCount,
    rejectedCount,
    pendingCount,
    filteredTotalCount: totalCount
  };
};

exports.getLeaveById = async (id) => {
  const filter = withTenant({ _id: id });
  const leave = await Leave.findOne(filter).lean();
  if (!leave) throw new Error("Leave record not found");

  // Re-compute status dynamically
  let effectiveStatus = leave.status;
  if (leave.status?.toLowerCase() !== "cancelled") {
    effectiveStatus = computeFinalStatus(leave.approvals || []);
  }

  if (effectiveStatus === "approved" && new Date(leave.to_date) < new Date()) {
    effectiveStatus = "closed";
  }

  return { ...leave, status: effectiveStatus };
};

exports.listLeaveBalances = async (employee_id) => {
  const leaveTypes = await LeaveType.find({ is_active: true }).lean();
  for (const lt of leaveTypes) {
    const existing = await LeaveBalance.findOne({ employee_id, leave_type: lt.name });
    if (!existing) {
      await LeaveBalance.create({
        employee_id,
        leave_type: lt.name,
        total: lt.total_days || 0,
        used: 0,
        balance: lt.total_days || 0
      });
    } else if (existing.total !== lt.total_days) {
       await LeaveBalance.updateOne(
         { _id: existing._id },
         { $set: { total: lt.total_days, balance: lt.total_days - existing.used } }
       );
    }
  }
  return await LeaveBalance.find({ employee_id }).lean();
};

/**
 * 1. APPLY LEAVE
 */
exports.applyLeave = async (input, context) => {
  let { employee_id, leave_type, from_date, to_date, institution_id, is_half_day, half_day_type } = input;
  
  // Safety: Handle empty strings or missing to_date for single-day/half-day leaves
  if (!to_date || to_date === "") to_date = from_date;
  if (!from_date || from_date === "") throw new Error("From date is required");
  
  const from = new Date(from_date);
  const to = new Date(to_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validations
  if (from > to) throw new Error("From date cannot be after To date");
  if (from < today) throw new Error("Cannot apply leave for past dates");

  // 1. Fetch LeaveType Config
  const leaveTypeConfig = await LeaveType.findOne({ name: leave_type.toLowerCase() });
  if (!leaveTypeConfig) throw new Error(`Leave type configuration for "${leave_type}" not found`);

  // 2. Fetch Employee for Gender Check
  const employee = await Employee.findOne({ _id: employee_id });
  if (!employee) throw new Error("Employee not found");

  // 3. Gender Applicability Check
  const empGender = employee.personal_detail?.gender || "Other";
  if (leaveTypeConfig.applicable_for && !leaveTypeConfig.applicable_for.includes(empGender)) {
    throw new Error(`This leave type is not applicable for ${empGender} employees`);
  }

  // 4. Advance Notice Check
  const daysDiff = Math.ceil((from - today) / (1000 * 60 * 60 * 24));
  if (leaveTypeConfig.days_before_apply > 0 && daysDiff < leaveTypeConfig.days_before_apply) {
    throw new Error(`This leave must be applied at least ${leaveTypeConfig.days_before_apply} days in advance`);
  }

  const settings = await Settings.findOne({});
  if (!settings) throw new Error("Settings not found");

  // Load live holidays from Holiday collection for the leave range
  const publicHolidays = await getHolidaysInRange(from, to);

  // 5. Holiday/Sunday Check — block if ANY day in range is a non-working day or holiday AND not covered
  const conflictingDates = [];
  const curr = new Date(from);
  while (curr <= to) {
    const d = new Date(curr);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const isWeekend = !settings.working_days.includes(dayName);
    const holiday = publicHolidays.find(h => new Date(h.date).toDateString() === d.toDateString());

    if (isWeekend && !leaveTypeConfig.weekends_covered) {
      conflictingDates.push(`${d.toDateString()} (Non-working day)`);
    } else if (holiday && !leaveTypeConfig.holiday_covered) {
      conflictingDates.push(`${d.toDateString()} (${holiday.name})`);
    }
    curr.setDate(curr.getDate() + 1);
  }

  if (conflictingDates.length > 0) {
    throw new Error(`Cannot apply leave: requested range includes uncovered holidays/non-working days: ${conflictingDates.join(", ")}`);
  }

  // 6. Working Days Count (Respecting LeaveType coverage)
  let totalDays = calculateWorkingDays(from, to, settings, {
    weekends_covered: leaveTypeConfig.weekends_covered,
    holiday_covered: leaveTypeConfig.holiday_covered
  }, publicHolidays);
  if (is_half_day) totalDays = 0.5;
  if (totalDays === 0) throw new Error("Selected range has no working days for this leave type");

  // 7. Max Consecutive Days Check
  const maxAllowed = leaveTypeConfig.max_consecutive_days || leaveTypeConfig.max_per_request || 0;
  if (maxAllowed > 0 && totalDays > maxAllowed) {
    throw new Error(`Maximum allowed duration is ${maxAllowed} days (requested: ${totalDays} days, including weekends/holidays if covered)`);
  }

  // 8. Attendance Conflict Check
  const conflictingAttendance = await Attendance.findOne({
    employee_id,
    date: { $gte: from, $lte: to },
    status: { $in: ["present", "late"] }
  });
  if (conflictingAttendance) throw new Error("Attendance already marked for the selected dates");

  // 9. Overlap Check
  const overlappingLeave = await Leave.findOne({
    employee_id,
    status: { $in: ["pending", "approved"] },
    $or: [{ from_date: { $lte: to }, to_date: { $gte: from } }]
  });
  if (overlappingLeave) throw new Error("You already have a pending or approved leave for these dates");

  // 10. Balance Check
  let balanceRec = await LeaveBalance.findOne({ 
    employee_id, 
    leave_type: { $regex: new RegExp(`^${leave_type}$`, "i") } 
  });

  if (!balanceRec) {
    // Fault-tolerance: Dynamically initialize balances if they don't exist yet
    await exports.listLeaveBalances(employee_id);
    balanceRec = await LeaveBalance.findOne({ 
      employee_id, 
      leave_type: { $regex: new RegExp(`^${leave_type}$`, "i") } 
    });
  }

  if (!balanceRec || balanceRec.balance <= 0 || balanceRec.balance < totalDays) {
    throw new Error(`Insufficient balance for ${leave_type}. Current balance: ${balanceRec?.balance || 0}`);
  }

  // Create
  const tenant_id = getTenantId();
  const leave = new Leave({ ...input, tenant_id, total_days: totalDays });
  const saved = await leave.save();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "LEAVE_APPLY",
    user_id: context?.user?.id || input.user_id,
    tenant_id,
    metadata: { leave_id: saved._id, type: leave_type, days: totalDays }
  });

  return saved;
};

/**
 * 2. APPROVAL LOGIC
 */
exports.updateLeaveApproval = async ({ id, role, status, remarks, institution_id, user_id }) => {
  const filter = applyTenantFilter({ _id: id, institution_id });
  const leave = await Leave.findOne(filter);
  if (!leave) throw new Error("Leave record not found");

  if (leave.status === "cancelled") {
    throw new Error(`Leave is cancelled and cannot be modified`);
  }

  // Fallback for legacy data with empty approvals
  if (!leave.approvals || leave.approvals.length === 0) {
    leave.approvals = [
      { role: "HEAD OF DEPARTMENT", status: "pending" },
      { role: "ADMIN", status: "pending" }
    ];
  }

  const approvalIdx = leave.approvals.findIndex(a => a.role === role);
  if (approvalIdx === -1) throw new Error(`Role ${role} is not a valid approver for this leave`);
  
  if (leave.approvals[approvalIdx].status !== "pending") {
    throw new Error(`Approver ${role} has already acted on this leave`);
  }

  const oldStatus = leave.status;

  // Update specific approval
  leave.approvals[approvalIdx].status = status;
  leave.approvals[approvalIdx].remarks = remarks;
  leave.approvals[approvalIdx].updated_at = new Date();

  // Compute final status
  const finalStatus = computeFinalStatus(leave.approvals);
  leave.status = finalStatus;

  // 3. BALANCE DEDUCTION / RESTORATION
  // Cases:
  // - Transition to 'approved': Deduct
  // - Transition away from 'approved': Restore (e.g. if one was approved, then another rejects)
  
  if (finalStatus === "approved" && oldStatus !== "approved") {
    const updateResult = await LeaveBalance.updateOne(
      { 
        employee_id: leave.employee_id, 
        leave_type: leave.leave_type,
        balance: { $gte: leave.total_days }
      },
      { $inc: { used: leave.total_days, balance: -leave.total_days } }
    );
    
    if (updateResult.modifiedCount === 0) {
      throw new Error("Insufficient balance at the time of approval");
    }
  } else if (oldStatus === "approved" && finalStatus !== "approved") {
    await LeaveBalance.updateOne(
      { employee_id: leave.employee_id, leave_type: leave.leave_type },
      { $inc: { used: -leave.total_days, balance: leave.total_days } }
    );
  }

  const saved = await leave.save();

  return saved;
};

/**
 * 4. CANCEL LEAVE
 */
exports.cancelLeave = async (id, institution_id) => {
  const filter = applyTenantFilter({ _id: id, institution_id });
  const leave = await Leave.findOne(filter);
  if (!leave) throw new Error("Leave record not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(leave.from_date);
  const to = new Date(leave.to_date);

  // Case 3: After leave completed
  if (to < today) throw new Error("Cannot cancel a leave that is already completed");

  const oldStatus = leave.status;
  
  // Logic for partial cancellation or full cancellation
  if (from > today) {
    // Case 1: Before leave starts -> Full Cancel
    leave.status = "cancelled";
  } else {
    // Case 2: During leave -> Cancel remaining
    // For simplicity, we mark the whole record as cancelled but this could 
    // be refined to split the record if needed. The user requested: 10 counted, 11,12 cancelled.
    // This implies adjusting the total_days and marking as cancelled.
    const settings = await Settings.findOne({});
    const workedDays = calculateWorkingDays(from, today, settings) - 1; // days before today
    const remainingDays = leave.total_days - workedDays;
    
    // Restore only the remaining days if it was approved
    if (oldStatus === "approved") {
      await LeaveBalance.updateOne(
        { employee_id: leave.employee_id, leave_type: leave.leave_type },
        { $inc: { used: -remainingDays, balance: remainingDays } }
      );
    }
    
    leave.total_days = workedDays;
    leave.status = "cancelled";
  }

  // Case 4: Restore full balance if approved and was before start
  if (oldStatus === "approved" && from > today) {
    await LeaveBalance.updateOne(
      { employee_id: leave.employee_id, leave_type: leave.leave_type },
      { $inc: { used: -leave.total_days, balance: leave.total_days } }
    );
  }

  const saved = await leave.save();

  return saved;
};

exports.createLeave = async (data) => {
  const leave = new Leave(data);
  return await leave.save();
};

exports.updateLeave = async (id, data, institution_id, user_id) => {
  // 1. Recalculate total_days if dates change
  if (data.from_date || data.to_date) {
    const existing = await Leave.findOne({ _id: id, institution_id });
    if (existing) {
       const from = new Date(data.from_date || existing.from_date);
       const to = new Date(data.to_date || existing.to_date);
       
       const leaveTypeReq = data.leave_type || existing.leave_type;
       const leaveTypeConfig = await LeaveType.findOne({ name: leaveTypeReq.toLowerCase() });
       if (leaveTypeConfig) {
         const settings = await Settings.findOne({});
         const publicHolidays = await getHolidaysInRange(from, to);
         
         let totalDays = calculateWorkingDays(from, to, settings, {
           weekends_covered: leaveTypeConfig.weekends_covered,
           holiday_covered: leaveTypeConfig.holiday_covered
         }, publicHolidays);
         
         if (existing.is_half_day) totalDays = 0.5;
         data.total_days = totalDays;
       }
    }
  }

  // Admin-only date edit — log as UPDATED business event
  const filter = applyTenantFilter({ _id: id, institution_id });
  const updated = await Leave.findOneAndUpdate(filter, { $set: data }, { new: true }).lean();
  if (updated) {
    const emp = await Employee.findOne({ _id: updated.employee_id }).lean();
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : updated.employee_id;
    const eventLogService = require("../eventLog/service");
    await eventLogService.logEvent({
      institution_id,
      user_id,
      user_name: "Admin",
      user_role: "HR Administrator",
      module_name: "leave",
      action_type: "UPDATED",
      record_id: id,
      description: `${empName} leave details updated`,
      new_data: updated
    });
  }
  return updated;
};

exports.deleteLeave = async (id, institution_id) => {
  const filter = applyTenantFilter({ _id: id, institution_id });
  const deleted = await Leave.findOneAndDelete(filter);
  if (!deleted) throw new Error("Leave record not found");
  return { success: true, message: "Leave record deleted successfully" };
};
