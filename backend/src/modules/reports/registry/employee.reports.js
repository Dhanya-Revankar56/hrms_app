/**
 * 📚 REPORT REGISTRY — Employee Category
 * Each object defines one complete report configuration.
 */

module.exports = [
  // 1️⃣ Employee Count Report
  {
    id: "employee.count",
    label: "Employee Count Report",
    category: "employee",
    model: "Employee",
    template: "employee-count",
    preFilter: { is_active: { $ne: false } },
    filters: [
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "work_detail.department",
        op: "$eq",
      },
      {
        key: "category",
        type: "enum",
        applyTo: "personal_detail.category",
        op: "$eq",
        options: ["Teaching", "Non-Teaching", "Support Staff", "General"],
      },
    ],
    fieldMap: {
      "work_detail.department.name": "Department",
      "personal_detail.category": "Category",
      _id: "Total Employees Count",
    },
    pipeline: [
      {
        $lookup: {
          from: "departments",
          localField: "work_detail.department",
          foreignField: "_id",
          as: "dept_info",
        },
      },
      { $unwind: { path: "$dept_info", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            dept: "$dept_info.name",
            cat: "$personal_detail.category",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: "$count",
          "work_detail.department.name": {
            $ifNull: ["$_id.dept", "Uncategorized"],
          },
          "personal_detail.category": { $ifNull: ["$_id.cat", "General"] },
        },
      },
    ],
    sortBy: { field: "work_detail.department.name", order: 1 },
  },

  // 2️⃣ Employee Onboarding Report
  {
    id: "employee.onboarding",
    label: "Employee Onboarding Report",
    category: "employee",
    model: "Employee",
    template: "base-report",
    groupBy: "work_detail.department.name",
    filters: [
      { key: "month", type: "month", applyTo: "work_detail.date_of_joining" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "work_detail.department",
        op: "$eq",
      },
    ],
    fieldMap: {
      name: "Employee Name",
      employee_id: "Employee ID",
      "work_detail.department.name": "Department",
      "work_detail.designation.name": "Designation",
      "work_detail.date_of_joining": "Date of Joining",
    },
    populate: [
      { path: "work_detail.department", select: "name" },
      { path: "work_detail.designation", select: "name" },
    ],
    sortBy: { field: "work_detail.date_of_joining", order: 1 },
  },

  // 3️⃣ Employee List Report
  {
    id: "employee.list",
    label: "Employee List Report",
    category: "employee",
    model: "Employee",
    template: "base-report",
    groupBy: "work_detail.department.name",
    preFilter: { is_active: { $ne: false } },
    filters: [
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "work_detail.department",
        op: "$eq",
      },
    ],
    fieldMap: {
      name: "Employee Name",
      employee_id: "Employee ID",
      "work_detail.department.name": "Department",
      "work_detail.designation.name": "Designation",
      user_contact: "Contact Number",
      user_email: "Email",
    },
    populate: [
      { path: "work_detail.department", select: "name" },
      { path: "work_detail.designation", select: "name" },
    ],
    sortBy: { field: "name", order: 1 },
  },

  // 4️⃣ Relieved Employee Report
  {
    id: "employee.relieved",
    label: "Relieved Employee Report",
    category: "employee",
    model: "Relieving",
    template: "base-report",
    groupBy: "employee_id.work_detail.department.name",
    preFilter: { status: "Relieved" },
    filters: [
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "employee_id",
        subQuery: "employeesByDepartment",
      },
      { key: "month", type: "month", applyTo: "last_working_date" },
    ],
    fieldMap: {
      "employee_id.name": "Employee Name",
      "employee_id.employee_id": "Employee ID",
      "employee_id.work_detail.department.name": "Department",
      "employee_id.work_detail.designation.name": "Designation",
      "employee_id.work_detail.date_of_joining": "Date of Joining",
      last_working_date: "Date of Relieving",
      reason: "Reason",
    },
    populate: [
      {
        path: "employee_id",
        populate: [
          { path: "work_detail.department", select: "name" },
          { path: "work_detail.designation", select: "name" },
        ],
      },
    ],
    sortBy: { field: "last_working_date", order: -1 },
  },
];
