const Employee = require("../employee/model");
const Attendance = require("../attendance/model");
const Leave = require("../leave/model");
const Department = require("../settings/department.model");

exports.getHrAnalytics = async (institution_id) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Employee Stats
  const [employees, allDepts] = await Promise.all([
    Employee.find({ institution_id, is_active: { $ne: false } }).lean(),
    Department.find({ institution_id }).lean()
  ]);

  const deptMap = allDepts.reduce((acc, d) => {
    acc[d._id.toString()] = d.name;
    return acc;
  }, {});

  const employeeStats = {
    total: employees.length,
    active: employees.filter(e => e.app_status === "active").length,
    onLeave: employees.filter(e => e.app_status === "on-leave").length,
    genderBreakdown: Object.entries(
      employees.reduce((acc, e) => {
        const g = e.personal_detail?.gender || "Other";
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {})
    ).map(([label, count]) => ({ label, count })),
    deptBreakdown: Object.entries(
      employees.reduce((acc, e) => {
        const dId = e.work_detail?.department?.toString();
        const dName = deptMap[dId] || "Unknown";
        acc[dName] = (acc[dName] || 0) + 1;
        return acc;
      }, {})
    ).map(([label, count]) => ({ label, count }))
  };

  // 2. Attendance Stats
  const todayAttendance = await Attendance.find({
    institution_id,
    date: { $gte: today }
  }).lean();

  const attendanceStats = {
    todayPresent: todayAttendance.filter(a => a.status === "Present").length,
    todayAbsent: todayAttendance.filter(a => a.status === "Absent").length,
    weeklyTrend: [] // Mock or simple last 7 days aggregation if needed
  };

  // 3. Leave Stats
  const leaves = await Leave.find({ institution_id }).lean();
  const leaveStats = {
    pending: leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    typeBreakdown: Object.entries(
      leaves.reduce((acc, l) => {
        const t = l.leave_type || "Other";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {})
    ).map(([label, count]) => ({ label, count }))
  };

  return {
    employeeStats,
    attendanceStats,
    leaveStats
  };
};
