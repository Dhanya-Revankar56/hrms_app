const Employee = require("../employee/model");
const Attendance = require("../attendance/model");
const Leave = require("../leave/model");
const Movement = require("../movement/model");
const EventLog = require("../eventLog/model");
const Department = require("../settings/department.model");
const Designation = require("../settings/designation.model");
const { withTenant } = require("../../utils/tenantUtils");

/**
 * Common filter builder for reports
 */
const buildFilters = (query) => {
  const { startDate, endDate, departmentId, role, employeeId } = query;
  const filters = {};

  if (startDate && endDate) {
    filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    filters.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filters.date = { $lte: new Date(endDate) };
  }

  if (departmentId) {
    filters["work_detail.department"] = departmentId;
  }

  if (role) {
    filters.app_role = role;
  }

  if (employeeId) {
    filters._id = employeeId;
  }

  return withTenant(filters);
};

// --- Employee Reports ---

exports.getEmployeeList = async (query) => {
  const filters = buildFilters(query);
  return await Employee.find(filters)
    .populate("work_detail.department", "name")
    .populate("work_detail.designation", "name")
    .lean();
};

exports.getNewJoiners = async (query) => {
  const { startDate, endDate } = query;
  const filters = withTenant({
    "work_detail.date_of_joining": {
      $gte: new Date(
        startDate || new Date().setDate(new Date().getDate() - 30),
      ),
      $lte: new Date(endDate || new Date()),
    },
  });
  return await Employee.find(filters)
    .populate("work_detail.department", "name")
    .lean();
};

exports.getExitReport = async (query) => {
  const filters = withTenant({
    app_status: { $in: ["resigned", "terminated", "relieved"] },
  });
  return await Employee.find(filters)
    .populate("work_detail.department", "name")
    .lean();
};

// --- Attendance Reports ---

exports.getAttendanceReport = async (query) => {
  const { startDate, endDate, departmentId } = query;
  let filters = {
    date: {
      $gte: new Date(startDate || new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(endDate || new Date().setHours(23, 59, 59, 999)),
    },
  };

  if (departmentId) {
    const employees = await Employee.find(
      withTenant({ "work_detail.department": departmentId }),
    ).select("_id");
    filters.employee_id = { $in: employees.map((e) => e._id) };
  }

  return await Attendance.find(withTenant(filters))
    .populate("employee_id", "first_name last_name employee_id")
    .sort({ date: -1 })
    .lean();
};

// --- Leave Reports ---

exports.getLeaveReport = async (query) => {
  const { startDate, endDate, type } = query;
  let filters = {};

  if (startDate && endDate) {
    filters.from_date = { $gte: new Date(startDate) };
    filters.to_date = { $lte: new Date(endDate) };
  }

  if (type) filters.leave_type = type;

  return await Leave.find(withTenant(filters))
    .populate("employee_id", "first_name last_name employee_id")
    .sort({ from_date: -1 })
    .lean();
};

// --- Movement Reports ---

exports.getMovementReport = async (query) => {
  const filters = buildFilters(query);
  // Adjust for movement model fields if different
  return await Movement.find(filters)
    .populate("employee_id", "first_name last_name employee_id")
    .lean();
};

// --- System & Summary ---

exports.getSystemReport = async (query) => {
  const { startDate, endDate, type } = query;
  let filters = {};

  if (startDate && endDate) {
    filters.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (type === "login") {
    filters.action_type = "LOGIN"; // Assuming this is the type used
  }

  return await EventLog.find(withTenant(filters))
    .sort({ timestamp: -1 })
    .limit(500)
    .lean();
};

exports.getHrOverview = async (user) => {
  // Reuse analytics logic but formatted for report
  const Employee = require("../employee/model");
  const baseFilter = withTenant({});

  const [total, active, onLeave, depts] = await Promise.all([
    Employee.countDocuments(baseFilter),
    Employee.countDocuments({ ...baseFilter, app_status: "active" }),
    Employee.countDocuments({ ...baseFilter, app_status: "on-leave" }),
    Department.find(withTenant({})).lean(),
  ]);

  return {
    summary: { total, active, onLeave },
    departments: depts.map((d) => ({ name: d.name, id: d._id })),
  };
};
