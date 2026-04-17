/**
 * 📚 REPORT REGISTRY — Leave Category
 * Each object defines one complete report configuration.
 */

module.exports = [
  // 1️⃣ Daily Leave Record Report
  {
    id: "leave.daily",
    label: "Daily Leave Record Report",
    category: "leave",
    model: "Leave",
    template: "base-report",
    groupBy: "Department", // groups by normalized column label
    preFilter: {
      status: {
        $in: ["approved", "pending", "rejected", "cancelled", "closed"],
      },
    },
    filters: [
      { key: "selectedDate", type: "date", subQuery: "activeOnDate" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
      { key: "leaveType", type: "string", applyTo: "leave_type", op: "$eq" },
    ],
    fieldMap: {
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      leave_type: "Leave Type",
      status: "Leave Status",
      from_date: "From Date",
      to_date: "To Date",
      total_days: "Total Days",
    },
    populate: [
      {
        path: "employee_id",
        select: "name employee_id work_detail personal_detail",
        populate: [
          { path: "work_detail.department", select: "name" },
          { path: "work_detail.designation", select: "name" },
        ],
      },
    ],
    sortBy: { field: "from_date", order: -1 },
  },

  // 2️⃣ Monthly Leave Record Report
  {
    id: "leave.monthly",
    label: "Monthly Leave Record Report",
    category: "leave",
    model: "Leave",
    template: "base-report",
    groupBy: "Department",
    filters: [
      { key: "month", type: "month", applyTo: "from_date" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
      { key: "leaveType", type: "string", applyTo: "leave_type", op: "$eq" },
    ],
    fieldMap: {
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      leave_type: "Leave Type",
      total_days: "Total Leaves Taken",
      status: "Leave Status",
    },
    populate: [
      {
        path: "employee_id",
        select: "name employee_id work_detail personal_detail",
        populate: [
          { path: "work_detail.department", select: "name" },
          { path: "work_detail.designation", select: "name" },
        ],
      },
    ],
    sortBy: { field: "from_date", order: -1 },
  },

  // 4️⃣ Leave Approval Report
  {
    id: "leave.approvals",
    label: "Leave Approval Report",
    category: "leave",
    model: "Leave",
    template: "base-report",
    preFilter: { status: "approved" },
    groupBy: "Department",
    filters: [
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
      { key: "month", type: "month", applyTo: "from_date" },
    ],
    fieldMap: {
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      leave_type: "Leave Type",
      from_date: "From Date",
      to_date: "To Date",
      total_days: "Total Days",
      status: "Status",
      reason: "Reason",
    },
    populate: [
      {
        path: "employee_id",
        select: "name employee_id work_detail",
        populate: [
          { path: "work_detail.department", select: "name" },
          { path: "work_detail.designation", select: "name" },
        ],
      },
    ],
    sortBy: { field: "created_at", order: -1 },
  },
];
