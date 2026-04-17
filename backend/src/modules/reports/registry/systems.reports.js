module.exports = [
  // ─── Event Register / Audit Logs ────────────────────────────────────────
  {
    id: "eventLog.audit",
    label: "Event Register Audit Log",
    category: "system",
    model: "EventLog",
    template: "system-report",
    filters: [
      { key: "startDate", type: "date", applyTo: "timestamp", op: "$gte" },
      { key: "endDate", type: "date", applyTo: "timestamp", op: "$lte" },
      { key: "module", type: "enum", applyTo: "module_name", op: "$eq" },
      {
        key: "departmentId",
        type: "objectId",
        applyTo: "user_id",
        subQuery: "employeesByDepartment",
        castToString: true, // Flag to ensure IDs are converted to strings for EventLog.user_id
      },
    ],
    fieldMap: {
      timestamp: "Time",
      user_name: "User",
      action_type: "Action",
      description: "Description",
    },
    sortBy: { field: "timestamp", order: -1 },
  },
];
