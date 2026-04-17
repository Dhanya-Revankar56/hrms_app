/**
 * 📚 REPORT REGISTRY — Attendance Category
 */

module.exports = [
  // ─── Daily Attendance ────────────────────────────────────────────────────
  {
    id: "attendance.daily",
    label: "Daily Attendance Report",
    category: "attendance",
    model: "Attendance",
    template: "attendance-report",
    filters: [
      { key: "startDate", type: "date", applyTo: "date", op: "$gte" },
      { key: "endDate", type: "date", applyTo: "date", op: "$lte" },
      { key: "status", type: "enum", applyTo: "status", op: "$eq" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment", // Triggers sub-query in queryEngine
      },
    ],
    fieldMap: {
      date: "Date",
      "employee_id.employee_id": "Emp ID",
      "employee_id.name": "Employee Name",
      check_in: "Check In",
      check_out: "Check Out",
      working_hours: "Work Hours",
      status: "Status",
    },
    populate: [{ path: "employee_id", select: "name employee_id" }],
    sortBy: { field: "date", order: -1 },
  },

  // ─── Late Arrivals ───────────────────────────────────────────────────────
  {
    id: "attendance.late",
    label: "Late Arrivals Report",
    category: "attendance",
    model: "Attendance",
    template: "attendance-report",
    preFilter: { status: "late" },
    filters: [
      { key: "startDate", type: "date", applyTo: "date", op: "$gte" },
      { key: "endDate", type: "date", applyTo: "date", op: "$lte" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
    ],
    fieldMap: {
      date: "Date",
      "employee_id.employee_id": "Emp ID",
      "employee_id.name": "Employee Name",
      check_in: "Check In Time",
      working_hours: "Work Hours",
      note: "Note",
    },
    populate: [{ path: "employee_id", select: "name employee_id" }],
    sortBy: { field: "date", order: -1 },
  },

  // ─── Absent Report ───────────────────────────────────────────────────────
  {
    id: "attendance.absent",
    label: "Absent Employees Report",
    category: "attendance",
    model: "Attendance",
    template: "attendance-report",
    preFilter: { status: "absent" },
    filters: [
      { key: "startDate", type: "date", applyTo: "date", op: "$gte" },
      { key: "endDate", type: "date", applyTo: "date", op: "$lte" },
    ],
    fieldMap: {
      date: "Date",
      "employee_id.employee_id": "Emp ID",
      "employee_id.name": "Employee Name",
      status: "Status",
      note: "Note",
    },
    populate: [{ path: "employee_id", select: "name employee_id" }],
    sortBy: { field: "date", order: -1 },
  },
];
