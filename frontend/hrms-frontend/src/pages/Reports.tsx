import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_SETTINGS } from "../graphql/settingsQueries";
import { GET_MY_PROFILE } from "../graphql/employeeQueries";
import { isHod } from "../utils/auth";

interface Report {
  id: string;
  name: string;
  description: string;
  type: string;
  filters?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  reports: Report[];
  description: string;
}

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Compensatory Off",
  "Duty Leave",
  "LWP",
  "Other",
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  .rep-wrapper { 
    --primary: #1e3a8a;
    --primary-hover: #172554;
    --bg: #f3f4f6;
    --card-bg: #ffffff;
    --text-main: #111827;
    --text-muted: #6b7280;
    --border: #d1d5db;
    
    padding: 24px; 
    background: var(--bg); 
    min-height: 100vh; 
    font-family: 'Inter', sans-serif;
  }

  /* ══ HEADER ══ */
  .rep-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .rep-back-arrow { font-size: 20px; cursor: pointer; color: var(--text-main); font-weight: 600; }
  .rep-title { font-size: 20px; font-weight: 700; color: var(--text-main); }

  /* ══ CATEGORY GRID ══ */
  .rep-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .rep-cat-card {
    background: var(--card-bg); border-radius: 12px; padding: 24px; border: 1px solid var(--border);
    transition: all 0.2s; cursor: pointer; display: flex; flex-direction: column; align-items: flex-start;
  }
  .rep-cat-card:hover { border-color: var(--primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .rep-cat-icon { font-size: 32px; margin-bottom: 16px; }
  .rep-cat-name { font-size: 18px; font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
  .rep-cat-desc { font-size: 13px; color: var(--text-muted); line-height: 1.4; }

  /* ══ REPORT LIST ══ */
  .rep-list-item {
    background: #fff; padding: 16px 20px; border: 1px solid var(--border); margin-bottom: 12px;
    border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    transition: 0.2s;
  }
  .rep-list-item:hover { border-color: var(--primary); background: #f8fafc; }
  .rep-list-item h4 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main); }
  .rep-list-item p { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

  /* ══ TOP ACTION BAR ══ */
  .rep-action-bar {
    display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 20px;
  }

  /* ══ FILTER PANEL ══ */
  .rep-filter-box {
    background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 24px; margin-bottom: 30px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .rep-field { position: relative; }
  .rep-field label {
    position: absolute; top: -8px; left: 12px; background: #fff; padding: 0 4px;
    font-size: 11px; font-weight: 600; color: var(--text-muted);
  }
  .rep-select, .rep-input {
    width: 100%; height: 44px; border: 1px solid var(--border); border-radius: 6px;
    padding: 0 12px; font-size: 14px; color: var(--text-main); outline: none;
  }
  .rep-select:focus, .rep-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1); }
  .rep-select:disabled, .rep-input:disabled { 
    background: #f8fafc; 
    color: #1e3a8a; 
    cursor: not-allowed; 
    -webkit-text-fill-color: #1e3a8a; 
    opacity: 1; 
    border-color: #cbd5e1;
    font-weight: 500;
  }
  .rep-field.is-locked label { 
    color: var(--primary); 
    font-weight: 700; 
    z-index: 10; 
    background: linear-gradient(to bottom, #f3f4f6 50%, #fff 50%);
  }
  .rep-field.is-locked .rep-select { 
    background-color: #f1f5f9;
    border-style: dashed;
  }

  /* ══ PREVIEW TABLE ══ */
  .rep-preview-container { background: #fff; border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; }
  .rep-table { width: 100%; border-collapse: collapse; min-width: 800px; }
  .rep-table th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border); }
  .rep-table td { padding: 14px 16px; font-size: 13px; color: var(--text-main); border-bottom: 1px solid #f3f4f6; }
  .emp-id-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* ══ STATUS BADGE ══ */
  .status-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
  }
  .status-approved { background: #d1fae5; color: #065f46; }
  .status-pending  { background: #fef3c7; color: #92400e; }
  .status-rejected { background: #fee2e2; color: #991b1b; }
  .status-cancelled{ background: #f3f4f6; color: #6b7280; }
  .status-closed   { background: #ede9fe; color: #5b21b6; }

  /* ══ DROP DOWN EXPORT ══ */
  .rep-dropdown { position: relative; }
  .rep-dropdown-menu {
    position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid var(--border);
    border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 120px; z-index: 50; margin-top: 4px;
  }
  .rep-dropdown-item { padding: 10px 16px; font-size: 13px; cursor: pointer; transition: 0.2s; }
  .rep-dropdown-item:hover { background: #f3f4f6; color: var(--primary); }

  /* ══ MODAL ══ */
  .rep-modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .rep-modal {
    background: #fff; width: 400px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    animation: modalScale 0.2s ease-out;
  }
  @keyframes modalScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .rep-modal-header { padding: 20px 24px; border-bottom: 1px solid #eee; font-weight: 600; font-size: 16px; color: var(--text-main); }
  .rep-modal-body { padding: 24px; text-align: center; }
  .rep-modal-footer { padding: 16px 24px; display: flex; justify-content: center; gap: 12px; }

  /* ══ BUTTONS ══ */
  .btn-report { background: #1e293b; color: #fff; padding: 10px 24px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; }
  .btn-export { background: #fff; color: #1e293b; padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .btn-action { padding: 8px 24px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-green { background: #10b981; color: #fff; }
  .btn-green:hover { background: #059669; }
  .btn-outline-green { border: 2px solid #10b981; color: #10b981; background: transparent; }
  .btn-outline-green:hover { background: #ecfdf5; }

  /* ══ COMING SOON ══ */
  .coming-soon-container { 
    padding: 60px 20px; text-align: center; border-radius: 12px; background: #fff; border: 1px dashed var(--border);
    margin-top: 20px;
  }
  .coming-soon-card { max-width: 500px; margin: 0 auto; }
  .coming-soon-card h2 { font-size: 28px; font-weight: 700; color: var(--text-main); margin-bottom: 16px; }
  .coming-soon-card p { font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-bottom: 30px; }
  .back-home-btn { 
    background: var(--primary); color: #fff; border: none; padding: 12px 32px; border-radius: 8px; 
    font-weight: 600; cursor: pointer; transition: 0.2s; 
  }
  .back-home-btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
`;

const Reports: React.FC = () => {
  const [view, setView] = useState<"CATEGORIES" | "REPORTS" | "GENERATE">(
    "CATEGORIES",
  );
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "2015-01-01",
    endDate: new Date().toISOString().split("T")[0],
    selectedDate: new Date().toISOString().split("T")[0],
    department: "All",
    employeeType: "All",
    category: "All",
    leaveType: "All",
    status: "All",
    month: new Date().toISOString().slice(0, 7),
    academicYear: "2025-26",
  });

  const { data: settingsData } = useQuery(GET_SETTINGS);
  const { data: profileData } = useQuery(GET_MY_PROFILE);

  const departments = settingsData?.settings?.departments || [];

  const currentUserDeptId = profileData?.me?.work_detail?.department?.id;
  const isUserHod = isHod();

  const isDailyLeave = (id?: string) => id === "leave.daily";
  const isMonthlyLeave = (id?: string) => id === "leave.monthly";
  const isLeaveApproval = (id?: string) => id === "leave.approvals";
  const isMovementDaily = (id?: string) => id === "movement.daily";
  const isMovementMonthly = (id?: string) => id === "movement.monthly";
  const isHolidayMonthly = (id?: string) => id === "holiday.monthly";
  const isHolidayYearly = (id?: string) => id === "holiday.yearly";

  // 🛡 HOD Enforcement: Lock department on mount/profile load
  useEffect(() => {
    if (isUserHod && currentUserDeptId) {
      // If we haven't set the department yet, or it was 'All', force it to the HOD's dept
      if (filters.department === "All" || filters.department === "") {
        setFilters((prev) => ({ ...prev, department: currentUserDeptId }));
      }
    }
  }, [isUserHod, currentUserDeptId, filters.department]);

  useEffect(() => {
    if (view === "GENERATE" && activeReport) {
      fetchPreview();
    }
  }, [view, activeReport, filters, fetchPreview]);

  const buildQueryString = useCallback(
    (extra: Record<string, string> = {}) => {
      if (!activeReport) return "";
      const p: Record<string, string> = {
        id: activeReport.id,
        startDate: filters.startDate,
        endDate: filters.endDate,
        selectedDate: filters.selectedDate,
        departmentId: filters.department === "All" ? "" : filters.department,
        category: filters.category === "All" ? "" : filters.category,
        leaveType: filters.leaveType === "All" ? "" : filters.leaveType,
        status: filters.status === "All" ? "" : filters.status,
        month: filters.month,
        academicYear: filters.academicYear,
        ...extra,
      };
      return Object.entries(p)
        .filter(([, v]) => v !== "")
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    },
    [activeReport, filters],
  );

  const fetchPreview = useCallback(async () => {
    if (!activeReport) return;
    setLoadingPreview(true);
    const url = `http://localhost:5000/api/reports?${buildQueryString({ limit: "10" })}`;
    try {
      const token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("tenant_id");
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-tenant-id": tenantId || "",
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error ${response.status}`);
      }
      const data = await response.json();
      setPreviewData(data.data || []);
      setPreviewColumns(data.columns || []);
    } catch (err: unknown) {
      console.error("Preview failed:", err);
      setPreviewData([]);
      setPreviewColumns([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [activeReport, buildQueryString]); // buildQueryString is defined outside but uses filters, I should probably also wrap buildQueryString in useCallback or just put activeReport and buildQueryString here.

  const validateFilters = () => {
    if (
      (isDailyLeave(activeReport?.id) || isMovementDaily(activeReport?.id)) &&
      !filters.selectedDate
    ) {
      alert("Please select a Date for this report.");
      return false;
    }
    if (
      (isMonthlyLeave(activeReport?.id) ||
        isMovementMonthly(activeReport?.id) ||
        isHolidayMonthly(activeReport?.id) ||
        activeReport?.id === "employee.onboarding") &&
      !filters.month
    ) {
      alert("Please select a Month for this report.");
      return false;
    }
    if (isHolidayYearly(activeReport?.id) && !filters.academicYear) {
      alert("Please select an Academic Year for this report.");
      return false;
    }
    return true;
  };

  const onGenerate = async (mode: "view" | "download") => {
    if (!activeReport) return;
    if (!validateFilters()) return;

    if (mode === "view") setViewing(true);
    else setDownloading(true);

    const url = `http://localhost:5000/api/reports?${buildQueryString()}&${mode === "view" ? "view" : "download"}=pdf`;
    try {
      const token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("tenant_id");
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-tenant-id": tenantId || "",
        },
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      if (mode === "view") {
        const w = window.open(blobUrl, "_blank");
        if (!w) {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `${activeReport.name}.pdf`;
          a.click();
        }
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${activeReport.name}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Error generating PDF.");
    } finally {
      setViewing(false);
      setDownloading(false);
      setShowModal(false);
    }
  };

  const handleCsvExport = () => {
    if (!activeReport) return;
    const url = `http://localhost:5000/api/reports?${buildQueryString()}&download=csv`;
    const token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("tenant_id");
    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "x-tenant-id": tenantId || "",
      },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = `${activeReport.name}_${Date.now()}.csv`;
        a.click();
        setShowExportOptions(false);
      })
      .catch(() => alert("Failed to export data."));
  };

  const statusBadge = (status: string) => {
    const cls = `status-badge status-${status?.toLowerCase() || "pending"}`;
    return <span className={cls}>{status || "—"}</span>;
  };

  const categories: Category[] = [
    {
      id: "employee",
      name: "Employee Reports",
      description: "Counts, directory, and onboarding/exit logs",
      icon: "👥",
      reports: [
        {
          id: "employee.count",
          name: "Employee Count Report",
          description: "Department-wise headcount summaries",
          type: "employee",
        },
        {
          id: "employee.onboarding",
          name: "Employee Onboarding Report",
          description: "List of new joiners by month",
          type: "employee",
        },
        {
          id: "employee.list",
          name: "Employee List Report",
          description: "Detailed staff directory with filters",
          type: "employee",
        },
        {
          id: "employee.relieved",
          name: "Relieved Employee Report",
          description: "Exited staff records and reasons",
          type: "employee",
        },
      ],
    },
    {
      id: "leave",
      name: "Leave Reports",
      description: "Daily records, monthly summaries, and approvals",
      icon: "📅",
      reports: [
        {
          id: "leave.daily",
          name: "Daily Leave Record Report",
          description: "All leave records for a specific date",
          type: "leave",
        },
        {
          id: "leave.monthly",
          name: "Monthly Leave Record Report",
          description: "Leave records for a selected month",
          type: "leave",
        },
        {
          id: "leave.approvals",
          name: "Leave Approval Report",
          description: "All leave requests filtered by status",
          type: "leave",
        },
      ],
    },
    {
      id: "movement",
      name: "Movement Register",
      description: "Official duty tracks and out-movements",
      icon: "🚀",
      reports: [
        {
          id: "movement.daily",
          name: "Daily Movement Register Report",
          description: "Track employee in/out movement for a specific date",
          type: "movement",
        },
        {
          id: "movement.monthly",
          name: "Monthly Movement Register Report",
          description: "Summary of employee movements over a selected month",
          type: "movement",
        },
      ],
    },
    {
      id: "holiday",
      name: "Holiday Reports",
      description: "Monthly and yearly holiday calendars",
      icon: "🎉",
      reports: [
        {
          id: "holiday.monthly",
          name: "Monthly Holiday List Report",
          description: "Holidays within a selected month",
          type: "holiday",
        },
        {
          id: "holiday.yearly",
          name: "Yearly Holiday List Report",
          description: "Academic year holiday calendar (June-May)",
          type: "holiday",
        },
      ],
    },
    {
      id: "attendance",
      name: "Attendance Reports",
      description: "Detailed logs and attendance trends",
      icon: "",
      isComingSoon: true, // Custom flag
      reports: [],
    },
    {
      id: "system",
      name: "System Logs",
      description: "Audit trail and event register",
      icon: "🛡️",
      reports: [
        {
          id: "eventLog.audit",
          name: "Event Audit Logs",
          description: "Activity trail for compliance",
          type: "system",
        },
      ],
    },
  ];

  const renderPreviewHeaders = () => {
    if (previewColumns.length > 0) {
      return previewColumns.map((col) => <th key={col}>{col}</th>);
    }
    return <th>Data</th>;
  };

  const renderPreviewRow = (row: Record<string, unknown>, i: number) => {
    if (previewColumns.length > 0) {
      return (
        <tr key={i}>
          <td style={{ textAlign: "center" }}>{i + 1}</td>
          {previewColumns.map((col) => {
            const val = row[col];
            if (col === "Leave Status" || col === "Status")
              return <td key={col}>{statusBadge(val)}</td>;
            return <td key={col}>{val ?? "—"}</td>;
          })}
        </tr>
      );
    }
    return (
      <tr key={i}>
        <td>{JSON.stringify(row)}</td>
      </tr>
    );
  };

  return (
    <div className="rep-wrapper">
      <style>{CSS}</style>

      {/* HEADER WITH BACK BUTTON */}
      <div className="rep-header">
        {view !== "CATEGORIES" && (
          <div
            className="rep-back-arrow"
            onClick={() => {
              if (view === "GENERATE") setView("REPORTS");
              else setView("CATEGORIES");
            }}
          >
            ←
          </div>
        )}
        <h1 className="rep-title">
          {view === "CATEGORIES"
            ? "Reports"
            : view === "REPORTS"
              ? activeCategory?.name
              : activeReport?.name}
        </h1>
      </div>

      {/* CATEGORY GRID */}
      {view === "CATEGORIES" && (
        <div className="rep-cat-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rep-cat-card"
              onClick={() => {
                setActiveCategory(cat);
                setView("REPORTS");
              }}
            >
              <div className="rep-cat-icon">{cat.icon}</div>
              <div className="rep-cat-name">{cat.name}</div>
              <div className="rep-cat-desc">{cat.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTS LIST */}
      {view === "REPORTS" && activeCategory && (
        <div>
          {activeCategory.isComingSoon ? (
            <div className="coming-soon-container">
              <div className="coming-soon-card">
                <p>
                  We are currently building this module to provide you with
                  comprehensive data insights. This feature will be enabled
                  shortly.
                </p>
                <button
                  className="back-home-btn"
                  onClick={() => setView("CATEGORIES")}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div>
              {activeCategory.reports.map((report) => (
                <div
                  key={report.id}
                  className="rep-list-item"
                  onClick={() => {
                    setActiveReport(report);
                    setPreviewData([]);
                    setPreviewColumns([]);
                    setView("GENERATE");
                  }}
                >
                  <div>
                    <h4>{report.name}</h4>
                    <p>{report.description}</p>
                  </div>
                  <div style={{ fontSize: 18, opacity: 0.4 }}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILTER PANEL & PREVIEW */}
      {view === "GENERATE" && (
        <div>
          <div className="rep-action-bar">
            <div className="rep-dropdown">
              <button
                className="btn-export"
                onClick={() => setShowExportOptions(!showExportOptions)}
              >
                <span style={{ fontSize: 16 }}>📥</span> Export
              </button>
              {showExportOptions && (
                <div className="rep-dropdown-menu">
                  <div className="rep-dropdown-item" onClick={handleCsvExport}>
                    EXCEL (CSV)
                  </div>
                  <div
                    className="rep-dropdown-item"
                    onClick={() => {
                      onGenerate("download");
                      setShowExportOptions(false);
                    }}
                  >
                    PDF Report
                  </div>
                </div>
              )}
            </div>
            <button className="btn-report" onClick={() => setShowModal(true)}>
              REPORT
            </button>
          </div>

          <div className="rep-filter-box">
            {/* ── EMPLOYEE REPORT FILTERS ── */}

            {/* Date Range for specific reports (excluding movement) */}
            {activeReport &&
              (activeReport.id.includes("exit") ||
                activeReport.id.includes("new") ||
                activeReport.id.includes("eventLog")) && (
                <>
                  <div className="rep-field">
                    <label>Start Date</label>
                    <input
                      type="date"
                      className="rep-input"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="rep-field">
                    <label>End Date</label>
                    <input
                      type="date"
                      className="rep-input"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

            {/* Month for employee onboarding / relieved */}
            {(activeReport?.id === "employee.onboarding" ||
              activeReport?.id === "employee.relieved") && (
              <div className="rep-field">
                <label>Month</label>
                <input
                  type="month"
                  className="rep-input"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                />
              </div>
            )}

            {/* ── LEAVE REPORT FILTERS ── */}

            {/* Specific Date (Daily leave / movement — mandatory) */}
            {(isDailyLeave(activeReport?.id) ||
              isMovementDaily(activeReport?.id)) && (
              <div className="rep-field">
                <label>Date *</label>
                <input
                  type="date"
                  className="rep-input"
                  value={filters.selectedDate}
                  onChange={(e) =>
                    setFilters({ ...filters, selectedDate: e.target.value })
                  }
                />
              </div>
            )}

            {/* Month picker for monthly leave / movement / holiday / approval */}
            {(isMonthlyLeave(activeReport?.id) ||
              isMovementMonthly(activeReport?.id) ||
              isHolidayMonthly(activeReport?.id) ||
              isLeaveApproval(activeReport?.id)) && (
              <div className="rep-field">
                <label>
                  Month{" "}
                  {isMonthlyLeave(activeReport?.id) ||
                  isMovementMonthly(activeReport?.id) ||
                  isHolidayMonthly(activeReport?.id)
                    ? "*"
                    : ""}
                </label>
                <input
                  type="month"
                  className="rep-input"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                />
              </div>
            )}

            {/* Academic Year for Holiday report */}
            {isHolidayYearly(activeReport?.id) && (
              <div className="rep-field">
                <label>Academic Year *</label>
                <select
                  className="rep-select"
                  value={filters.academicYear}
                  onChange={(e) =>
                    setFilters({ ...filters, academicYear: e.target.value })
                  }
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
            )}

            {/* Department — all reports (except Employee Count) */}
            {activeReport?.id !== "employee.count" &&
              !isHolidayMonthly(activeReport?.id) &&
              !isHolidayYearly(activeReport?.id) && (
                <div className={`rep-field ${isUserHod ? "is-locked" : ""}`}>
                  <label>Department {isUserHod ? "(Locked)" : ""}</label>
                  <select
                    className="rep-select"
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({ ...filters, department: e.target.value })
                    }
                    disabled={isUserHod}
                  >
                    {!isUserHod && <option value="All">All Departments</option>}
                    {departments.map((d: { id: string; name: string }) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {/* Filters */}

            {/* Leave Type — daily, monthly, approval */}
            {(isDailyLeave(activeReport?.id) ||
              isMonthlyLeave(activeReport?.id) ||
              isLeaveApproval(activeReport?.id)) && (
              <div className="rep-field">
                <label>Leave Type</label>
                <select
                  className="rep-select"
                  value={filters.leaveType}
                  onChange={(e) =>
                    setFilters({ ...filters, leaveType: e.target.value })
                  }
                >
                  <option value="All">All Types</option>
                  {LEAVE_TYPES.map((lt) => (
                    <option key={lt} value={lt}>
                      {lt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status — any other reports if needed (currently hidden for approval report) */}
          </div>

          {/* PREVIEW TABLE */}
          <div className="rep-preview-container">
            {loadingPreview ? (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                Fetching preview data...
              </div>
            ) : (
              <table className="rep-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Sl No</th>
                    {renderPreviewHeaders()}
                  </tr>
                </thead>
                <tbody>
                  {previewData.length > 0 ? (
                    previewData.map((row, i) => renderPreviewRow(row, i))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 40,
                          color: "#999",
                        }}
                      >
                        No data found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* GENERATE MODAL */}
      {showModal && (
        <div className="rep-modal-overlay">
          <div className="rep-modal">
            <div className="rep-modal-header">Download the Report</div>
            <div className="rep-modal-body">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 18, color: "#1e293b" }}>
                {activeReport?.name}
              </div>
            </div>
            <div className="rep-modal-footer">
              <button
                className="btn-action btn-outline-green"
                onClick={() => onGenerate("download")}
                disabled={downloading}
              >
                {downloading ? "Preparing..." : "Download"}
              </button>
              <button
                className="btn-action btn-green"
                onClick={() => onGenerate("view")}
                disabled={viewing}
              >
                {viewing ? "Viewing..." : "View"}
              </button>
            </div>
            <div style={{ textAlign: "center", paddingBottom: 20 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
