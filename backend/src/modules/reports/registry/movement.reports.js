/**
 * 📚 REPORT REGISTRY — Movement Register Category
 * Each object defines one complete report configuration.
 */

module.exports = [
  // 1️⃣ Daily Movement Register Report
  {
    id: "movement.daily",
    label: "Daily Movement Register Report",
    category: "movement",
    model: "MovementRegister",
    template: "base-report",
    groupBy: "Department",
    filters: [
      {
        key: "selectedDate",
        type: "date",
        applyTo: "movement_date",
        op: "$gte",
      },
      {
        key: "selectedDate",
        type: "date",
        applyTo: "movement_date",
        op: "$lte",
      },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
    ],
    fieldMap: {
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      out_time: "Out Time",
      in_time: "In Time",
      purpose: "Purpose / Remarks",
      admin_status: "Final Status",
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
    sortBy: { field: "out_time", order: 1 },
  },

  // 2️⃣ Monthly Movement Register Report
  {
    id: "movement.monthly",
    label: "Monthly Movement Register Report",
    category: "movement",
    model: "MovementRegister",
    template: "base-report",
    groupBy: "Department",
    filters: [
      { key: "month", type: "month", applyTo: "movement_date" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
    ],
    fieldMap: {
      movement_date: "Date",
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      out_time: "Out Time",
      in_time: "In Time",
      purpose: "Purpose / Remarks",
      admin_status: "Final Status",
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
    sortBy: { field: "movement_date", order: 1 },
  },
];
