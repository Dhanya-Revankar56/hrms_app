/**
 * 📚 REPORT REGISTRY — Holiday Category
 * Each object defines one complete report configuration.
 */

module.exports = [
  // 1️⃣ Monthly Holiday List Report
  {
    id: "holiday.monthly",
    label: "Monthly Holiday List Report",
    category: "holiday",
    model: "Holiday",
    template: "base-report",
    filters: [{ key: "month", type: "month", applyTo: "date" }],
    fieldMap: {
      name: "Holiday Name",
      date: "Holiday Date",
    },
    sortBy: { field: "date", order: 1 },
  },

  // 2️⃣ Yearly Holiday List Report
  {
    id: "holiday.yearly",
    label: "Yearly Holiday List Report",
    category: "holiday",
    model: "Holiday",
    template: "base-report",
    filters: [{ key: "academicYear", type: "academicYear", applyTo: "date" }],
    fieldMap: {
      name: "Holiday Name",
      date: "Holiday Date",
      __day: "Day",
      __month: "Month",
    },
    sortBy: { field: "date", order: 1 },
  },
];
