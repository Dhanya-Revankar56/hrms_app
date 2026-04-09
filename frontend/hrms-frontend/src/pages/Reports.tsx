import React, { useState } from "react";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";

interface Report {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  reports: Report[];
}

const CSS = `
  .rp-container { padding: 32px; background: #f8fafc; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
  .rp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .rp-title { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
  .rp-subtitle { color: #64748b; font-size: 14px; font-weight: 500; margin-top: 4px; }

  .rp-categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; padding: 4px; }
  .rp-category-card {
    background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .rp-category-card:hover { transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1); }
  .rp-category-icon {
    width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
    background: #eff6ff; color: #3b82f6;
  }
  .rp-category-name { font-size: 18px; font-weight: 700; color: #1e293b; }
  .rp-category-count { font-size: 13px; color: #64748b; font-weight: 500; }

  .rp-report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
  .rp-report-card {
    background: #fff; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 20px;
    display: flex; align-items: center; gap: 16px; transition: 0.2s; cursor: pointer;
  }
  .rp-report-card:hover { border-color: #3b82f6; background: #f8faff; }
  .rp-report-info h4 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
  .rp-report-info p { margin: 4px 0 0; font-size: 12px; color: #64748b; }

  .rp-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .rp-filter-bar { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: #fafbfe; }
  .rp-filter-select, .rp-filter-input { height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; outline: none; font-size: 13px; }
  .rp-filter-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; }

  .rp-table { width: 100%; border-collapse: collapse; }
  .rp-table th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .rp-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; }

  .rp-back-btn { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #3b82f6; cursor: pointer; border: none; background: none; margin-bottom: 24px; padding: 0; }
  .rp-back-btn:hover { color: #2563eb; }

  .rp-export-btns { display: flex; gap: 10px; }
  .rp-btn { height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; border: 1px solid #e2e8f0; }
  .rp-btn-primary { background: #3b82f6; color: #fff; border: none; }
  .rp-btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
  .rp-btn-outline { background: #fff; color: #475569; }
  .rp-btn-outline:hover { background: #f8fafc; border-color: #3b82f6; color: #3b82f6; }

  .loading-shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const Reports: React.FC = () => {
  const [view, setView] = useState<"CATEGORIES" | "REPORTS" | "TABLE">(
    "CATEGORIES",
  );
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    department: "All",
    role: "All",
    search: "",
  });
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const categories: Category[] = [
    {
      id: "employee",
      name: "Employee Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      reports: [
        {
          id: "emp-list",
          name: "Employee List",
          description: "Complete organizational directory with contact info",
          type: "list",
        },
        {
          id: "emp-summary",
          name: "Employee Summary",
          description: "Consolidated summary of employee demographics",
          type: "summary",
        },
        {
          id: "emp-count",
          name: "Employee Count",
          description: "Headcount breakdown by various parameters",
          type: "count",
        },
        {
          id: "new-joiners",
          name: "New Joiners",
          description: "Onboarding tracking for recent hires",
          type: "new-joiners",
        },
        {
          id: "exit-report",
          name: "Exit Report",
          description: "Offboarding and attrition analytics",
          type: "exit",
        },
        {
          id: "dept-dist",
          name: "Department-wise Distribution",
          description: "Employee allocation across departments",
          type: "dept-dist",
        },
        {
          id: "role-dist",
          name: "Role-wise Report",
          description: "Employee breakdown by organizational roles",
          type: "role-dist",
        },
      ],
    },
    {
      id: "attendance",
      name: "Attendance Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      reports: [
        {
          id: "att-daily",
          name: "Daily Attendance",
          description: "Daily check-in/out status report",
          type: "daily",
        },
        {
          id: "att-monthly",
          name: "Monthly Attendance",
          description: "Aggregated monthly attendance records",
          type: "monthly",
        },
        {
          id: "att-datewise",
          name: "Date-wise Attendance",
          description: "Specific date range attendance details",
          type: "datewise",
        },
        {
          id: "late-time",
          name: "Late Time Report",
          description: "Tracking late arrivals and early departures",
          type: "late",
        },
        {
          id: "monthly-status",
          name: "Monthly Status Report",
          description: "Summary of individual status over the month",
          type: "status",
        },
        {
          id: "att-percent",
          name: "Attendance Percentage Report",
          description: "Overall attendance efficiency analytics",
          type: "percentage",
        },
      ],
    },
    {
      id: "leave",
      name: "Leave Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      reports: [
        {
          id: "leave-history",
          name: "Leave History",
          description: "Historical log of all leave applications",
          type: "history",
        },
        {
          id: "leave-daily",
          name: "Daily Leave",
          description: "Leaves active on a specific day",
          type: "daily",
        },
        {
          id: "leave-monthly",
          name: "Monthly Leave",
          description: "Monthly leave trends and summaries",
          type: "monthly",
        },
        {
          id: "leave-balance",
          name: "Leave Balance",
          description: "Current remaining leave quotas per employee",
          type: "balance",
        },
        {
          id: "leave-move",
          name: "Leave Movement",
          description: "Tracking leave transitions and approvals",
          type: "movement",
        },
        {
          id: "most-leave",
          name: "Most Leave Taken Report",
          description: "Analytics on high leave utilization",
          type: "most-taken",
        },
      ],
    },
    {
      id: "movement",
      name: "Movement Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 13.1V16c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      ),
      reports: [
        {
          id: "move-reg",
          name: "Movement Register",
          description: "Detailed log of official movements",
          type: "register",
        },
        {
          id: "move-daily",
          name: "Daily Movement",
          description: "Summary of movements for the current day",
          type: "daily",
        },
      ],
    },
    {
      id: "timesheet",
      name: "Timesheet Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      reports: [
        {
          id: "ts-report",
          name: "Time Sheet Report",
          description: "Standard timesheet submission tracking",
          type: "standard",
        },
        {
          id: "ts-custom",
          name: "Custom Time Sheet Report",
          description: "Filtered and customized timesheet views",
          type: "custom",
        },
      ],
    },
    {
      id: "system",
      name: "System Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      reports: [
        {
          id: "sys-login",
          name: "Login History Report",
          description: "Audit log of user authentication events",
          type: "login",
        },
        {
          id: "sys-activity",
          name: "User Activity Report",
          description: "Detailed log of system interactions",
          type: "activity",
        },
      ],
    },
    {
      id: "summary",
      name: "Summary Reports",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
      reports: [
        {
          id: "hr-overview",
          name: "HR Overview Report",
          description: "Comprehensive dashboard summary of HR metrics",
          type: "overview",
        },
      ],
    },
  ];

  const fetchReportData = async (catId: string, type: string) => {
    setLoadingReport(true);
    try {
      const queryParams = new URLSearchParams({
        category: catId,
        type: type,
        ...filters,
      });
      const response = await fetch(
        `http://localhost:5000/api/reports?${queryParams}`,
      );
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (err) {
      console.error("Fetch report failed", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setView("REPORTS");
  };

  const handleReportClick = (report: Report) => {
    setActiveReport(report);
    setView("TABLE");
    fetchReportData(activeCategory!.id, report.type);
  };

  const handleBack = () => {
    if (view === "TABLE") setView("REPORTS");
    else if (view === "REPORTS") setView("CATEGORIES");
  };

  const handleExport = (format: "csv" | "pdf") => {
    const fileName = `${activeReport?.name || "Report"}_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      exportToCSV(reportData, fileName);
    } else {
      exportToPDF(reportData, fileName, activeReport?.name || "HR Report");
    }
  };

  // Helper to format table values
  const renderCell = (val: unknown) => {
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      return String(obj.name || obj.id || JSON.stringify(val));
    }
    return String(val || "—");
  };

  return (
    <div className="rp-container">
      <style>{CSS}</style>

      {view !== "CATEGORIES" && (
        <button className="rp-back-btn" onClick={handleBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to {view === "TABLE" ? activeCategory?.name : "Categories"}
        </button>
      )}

      <div className="rp-header">
        <div>
          <h1 className="rp-title">
            {view === "CATEGORIES"
              ? "HR Analytics & Reports"
              : view === "REPORTS"
                ? activeCategory?.name
                : activeReport?.name}
          </h1>
          <p className="rp-subtitle">
            {view === "CATEGORIES"
              ? "Select a category to view specialized reports"
              : view === "REPORTS"
                ? `Found ${activeCategory?.reports.length} reports in this module`
                : `Generated on ${new Date().toLocaleDateString()}`}
          </p>
        </div>

        {view === "TABLE" && (
          <div className="rp-export-btns">
            <button
              className="rp-btn rp-btn-outline"
              onClick={() => handleExport("csv")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            <button
              className="rp-btn rp-btn-primary"
              onClick={() => handleExport("pdf")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Download PDF
            </button>
          </div>
        )}
      </div>

      {view === "CATEGORIES" && (
        <div className="rp-categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rp-category-card"
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="rp-category-icon">{cat.icon}</div>
              <div>
                <div className="rp-category-name">{cat.name}</div>
                <div className="rp-category-count">
                  {cat.reports.length} Standard Reports
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "REPORTS" && (
        <div className="rp-report-grid">
          {activeCategory?.reports.map((report) => (
            <div
              key={report.id}
              className="rp-report-card"
              onClick={() => handleReportClick(report)}
            >
              <div
                className="rp-category-icon"
                style={{ width: 40, height: 40, borderRadius: 10 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                </svg>
              </div>
              <div className="rp-report-info">
                <h4>{report.name}</h4>
                <p>{report.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "TABLE" && (
        <div className="rp-table-card">
          <div className="rp-filter-bar">
            <div>
              <label className="rp-filter-label">Date From</label>
              <input
                type="date"
                className="rp-filter-input"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="rp-filter-label">Date To</label>
              <input
                type="date"
                className="rp-filter-input"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="rp-filter-label">Department</label>
              <select
                className="rp-filter-select"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="All">All Departments</option>
                <option value="IT">IT Department</option>
                <option value="HR">HR Department</option>
              </select>
            </div>
            <button
              className="rp-btn rp-btn-primary"
              style={{ marginTop: 18 }}
              onClick={() =>
                fetchReportData(activeCategory!.id, activeReport!.type)
              }
            >
              Apply Filters
            </button>
            <input
              className="rp-filter-input"
              placeholder="Search in results..."
              style={{ flex: 1, marginTop: 18 }}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="rp-table">
              <thead>
                <tr>
                  {reportData.length > 0 ? (
                    Object.keys(reportData[0]).map((key) => (
                      <th key={key}>{key.replace(/_/g, " ")}</th>
                    ))
                  ) : (
                    <th>No Data</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loadingReport ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10}>
                        <div
                          className="loading-shimmer"
                          style={{ height: 20, borderRadius: 4 }}
                        />
                      </td>
                    </tr>
                  ))
                ) : reportData.length > 0 ? (
                  reportData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: unknown, j) => (
                        <td key={j}>{renderCell(val)}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#94a3b8",
                      }}
                    >
                      No records found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
