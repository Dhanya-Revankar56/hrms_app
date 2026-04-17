const Employee = require("../employee/model");
const Attendance = require("../attendance/model");
const Leave = require("../leave/model");
const Movement = require("../movement/model");
const EventLog = require("../eventLog/model");
const Department = require("../settings/department.model");
const { withTenant } = require("../../utils/tenantUtils");

/**
 * 🛠 DATA NORMALIZER: Flattens complex Mongoose objects for easy table/PDF rendering
 */
const normalizeData = (item, type) => {
  if (!item) return null;

  switch (type) {
    case "employee":
      return {
        "Emp ID": item.employee_id || "N/A",
        Name: item.name || `${item.first_name} ${item.last_name}`,
        Department: item.work_detail?.department?.name || "Unassigned",
        Designation: item.work_detail?.designation?.name || "Unassigned",
        "Join Date": item.work_detail?.joining_date
          ? new Date(item.work_detail.joining_date).toLocaleDateString()
          : "N/A",
        Status: item.status?.toUpperCase() || "ACTIVE",
        Email: item.email || "N/A",
        Contact: item.user_contact || "N/A",
      };

    case "attendance":
      return {
        Date: item.date ? new Date(item.date).toLocaleDateString() : "N/A",
        "Emp ID": item.employee_id?.employee_id || item.employee_code || "N/A",
        "Employee Name": item.employee_id?.name || "N/A",
        "Check In": item.check_in || "--:--",
        "Check Out": item.check_out || "--:--",
        Status: item.status?.toUpperCase() || "PRESENT",
        "Work Hours": item.working_hours
          ? `${item.working_hours} hrs`
          : "0 hrs",
      };

    case "leave":
      return {
        "Emp ID": item.employee_id?.employee_id || item.employee_code || "N/A",
        "Employee Name": item.employee_id?.name || "N/A",
        "Leave Type": item.leave_type || "N/A",
        From: item.from_date
          ? new Date(item.from_date).toLocaleDateString()
          : "N/A",
        To: item.to_date ? new Date(item.to_date).toLocaleDateString() : "N/A",
        Days: item.total_days || 0,
        Status: item.status?.toUpperCase() || "PENDING",
        Reason: item.reason || "N/A",
      };

    case "movement":
      return {
        Date: item.date ? new Date(item.date).toLocaleDateString() : "N/A",
        "Emp ID": item.employee_id?.employee_id || "N/A",
        "Employee Name": item.employee_id?.name || "N/A",
        "Out Time": item.out_time || "--:--",
        "In Time": item.in_time || "--:--",
        Purpose: item.purpose || "N/A",
        Location: item.location || "N/A",
      };

    case "system":
      return {
        Timestamp: item.timestamp
          ? new Date(item.timestamp).toLocaleString()
          : "N/A",
        Action: item.action_type || "N/A",
        Module: item.module || "SYSTEM",
        Details: item.description || item.metadata?.details || "N/A",
        User: item.user_id?.name || "System",
      };

    default:
      return item;
  }
};

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
  const data = await Employee.find(filters)
    .populate("work_detail.department", "name")
    .populate("work_detail.designation", "name")
    .lean();
  return data.map((item) => normalizeData(item, "employee"));
};

exports.getNewJoiners = async (query) => {
  const { startDate, endDate } = query;
  const filters = withTenant({
    "work_detail.joining_date": {
      $gte: new Date(
        startDate || new Date().setDate(new Date().getDate() - 30),
      ),
      $lte: new Date(endDate || new Date()),
    },
  });
  const data = await Employee.find(filters)
    .populate("work_detail.department", "name")
    .populate("work_detail.designation", "name")
    .lean();
  return data.map((item) => normalizeData(item, "employee"));
};

exports.getExitReport = async (_query) => {
  const filters = withTenant({
    status: { $in: ["relieved", "inactive"] },
  });
  const data = await Employee.find(filters)
    .populate("work_detail.department", "name")
    .populate("work_detail.designation", "name")
    .lean();
  return data.map((item) => normalizeData(item, "employee"));
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

  const data = await Attendance.find(withTenant(filters))
    .populate("employee_id", "name employee_id")
    .sort({ date: -1 })
    .lean();
  return data.map((item) => normalizeData(item, "attendance"));
};

// --- Leave Reports ---

exports.getLeaveReport = async (query) => {
  const { startDate, endDate, type } = query;
  let filters = {};

  if (startDate && endDate) {
    filters.from_date = { $gte: new Date(startDate) };
    filters.to_date = { $lte: new Date(endDate) };
  }

  if (type && type !== "all") filters.leave_type = type;

  const data = await Leave.find(withTenant(filters))
    .populate("employee_id", "name employee_id")
    .sort({ from_date: -1 })
    .lean();
  return data.map((item) => normalizeData(item, "leave"));
};

// --- Movement Reports ---

exports.getMovementReport = async (query) => {
  const { startDate, endDate, departmentId } = query;
  let filters = {};

  if (startDate && endDate) {
    filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (departmentId) {
    const employees = await Employee.find(
      withTenant({ "work_detail.department": departmentId }),
    ).select("_id");
    filters.employee_id = { $in: employees.map((e) => e._id) };
  }

  const data = await Movement.find(withTenant(filters))
    .populate("employee_id", "name employee_id")
    .sort({ date: -1 })
    .lean();
  return data.map((item) => normalizeData(item, "movement"));
};

// --- System & Summary ---

exports.getSystemReport = async (query) => {
  const { startDate, endDate, type } = query;
  let filters = {};

  if (startDate && endDate) {
    filters.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (type === "login") {
    filters.action_type = "LOGIN";
  }

  const data = await EventLog.find(withTenant(filters))
    .populate("user_id", "name")
    .sort({ timestamp: -1 })
    .limit(500)
    .lean();
  return data.map((item) => normalizeData(item, "system"));
};

exports.getHrOverview = async (_user) => {
  const baseFilter = withTenant({});

  const [total, active, onLeave, depts] = await Promise.all([
    Employee.countDocuments(baseFilter),
    Employee.countDocuments({ ...baseFilter, status: "active" }),
    Employee.countDocuments({ ...baseFilter, status: "on-leave" }),
    Department.countDocuments(baseFilter),
  ]);

  return [
    {
      "Report Metric": "Total Headcount",
      Value: total,
      Description: "Total registered employees",
    },
    {
      "Report Metric": "Active Workforce",
      Value: active,
      Description: "Currently active staff",
    },
    {
      "Report Metric": "Currently On Leave",
      Value: onLeave,
      Description: "Staff with approved leave today",
    },
    {
      "Report Metric": "Total departments",
      Value: depts,
      Description: "Registered organizational units",
    },
  ];
};
