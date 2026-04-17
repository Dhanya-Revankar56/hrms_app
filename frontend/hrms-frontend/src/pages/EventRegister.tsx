import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_EVENT_LOGS } from "../graphql/eventLogQueries";

/* ─────────────────────────────────────────────
   STYLING
   Using CSS-in-JS for isolation and premium look 
   Updated with Tabs and Timeline Support
───────────────────────────────────────────── */
const CSS = `
  .er-container { animation: erFadeIn 0.5s ease-out; color: #1e293b; }
  @keyframes erFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .er-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .er-title-group { display: flex; flex-direction: column; gap: 4px; }
  .er-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px; font-family: 'DM Sans', sans-serif; }
  .er-subtitle { font-size: 14px; color: #64748b; margin: 0; font-family: 'DM Sans', sans-serif; font-weight: 500; }

  /* ── Filter Bar ── */
  .er-filter-bar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; background: #fff; }
  .er-search-wrap { position: relative; flex: 0 0 200px; }
  .er-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .er-search { width: 100%; height: 38px; padding: 0 12px 0 34px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #0f172a; background: #fafafa; outline: none; transition: 0.14s; }
  .er-search:focus { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 3px rgba(79,70,229,.09); }

  .er-filter-sel {
    height: 38px; padding: 0 28px 0 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #334155;
    background: #fafafa; outline: none; cursor: pointer; flex-shrink: 0; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; transition: 0.2s;
  }
  .er-filter-sel:focus { border-color: #4f46e5; background: #fff; }
  
  .er-filter-divider { width: 1px; height: 20px; background: #e2e8f0; flex-shrink: 0; margin: 0 6px; }
  .er-filter-count { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-left: auto; }

  /* ── Table & Cards ── */
  .er-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
  .er-table { width: 100%; border-collapse: collapse; }
  .er-table th { background: #f8fafc; padding: 16px 20px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.02em; }
  .er-table td { padding: 20px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-family: 'DM Sans', sans-serif; }

  /* ── Badges ── */
  .er-badge-action {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 10px; font-weight: 800; text-transform: uppercase;
  }
  .er-action-joined { background: #dcfce7; color: #166534; }
  .er-action-updated { background: #dbeafe; color: #1e40af; }
  .er-action-deleted { background: #fee2e2; color: #991b1b; }
  .er-action-relieved { background: #fef9c3; color: #854d0e; }
  .er-action-created { background: #eff6ff; color: #1d4ed8; }

  /* ── Empty State ── */
  .er-empty { padding: 80px 20px; text-align: center; color: #94a3b8; }
  .er-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .er-empty-text { font-size: 15px; font-weight: 600; }

  .er-btn-view { background: #fff; color: #4f46e5; border: 1.5px solid #e0e7ff; padding: 6px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .er-btn-view:hover { background: #4f46e5; color: #fff; border-color: #4f46e5; }
  
  .er-employee-select {
    width: 300px; height: 44px; margin-bottom: 40px; padding: 0 16px; border: 2px solid #e2e8f0; border-radius: 12px;
    font-size: 14px; font-weight: 700; color: #0f172a; outline: none; transition: 0.3s;
  }
  .er-employee-select:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,0.1); }
`;

/* ─────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────── */
interface EventLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  action_type: "JOINED" | "UPDATED" | "CREATED" | "DELETED" | "RELIEVED";
  module_name: string;
  record_id?: string;
  description?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string;
  timestamp: string;
}

interface EventLogResponse {
  eventLogs: {
    items: EventLog[];
    pageInfo: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
    };
  };
}

const MODULE_MAP: Record<string, string> = {
  employee: "Employee Management",
  onboarding: "Employee Onboarding",
  leave: "Leave Management",
  attendance: "Attendance",
  movement: "Movement Register",
  relieving: "Relieving",
  relieve: "Relieving",
  settings: "Settings",
  holiday: "Holidays",
  holidays: "Holidays",
  "Employee Management": "Employee Management",
  "Employee Onboarding": "Employee Onboarding",
  "Leave Management": "Leave Management",
  "Movement Register": "Movement Register",
  Attendance: "Attendance",
  Relieving: "Relieving",
  Settings: "Settings",
  Holidays: "Holidays",
};

const MODULES = [
  "Employee Onboarding",
  "Employee Management",
  "Attendance",
  "Leave Management",
  "Movement Register",
  "Relieving",
  "Holidays",
  "Settings",
];
const ACTIONS = [
  "JOINED",
  "UPDATED",
  "CREATED",
  "DELETED",
  "RELIEVED",
  "REJOINED",
];

export default function EventRegister() {
  const [filters, setFilters] = useState({
    module_name: "",
    action_type: "",
    date_from: "",
    date_to: "",
    search: "",
  });

  const [searchValue, setSearchValue] = useState("");

  // 🛡 Debounced Search Implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchValue }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const [selectedLog, setSelectedLog] = useState<EventLog | null>(null);

  const { data, loading } = useQuery<EventLogResponse>(GET_EVENT_LOGS, {
    variables: {
      ...filters,
      pagination: { page: 1, limit: 100 },
    },
    fetchPolicy: "network-only",
  });

  const logs: EventLog[] = data?.eventLogs?.items || [];

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { date: "Invalid", time: "" };
    return {
      date: d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const formatAction = (action: string) => {
    return (
      action.charAt(0).toUpperCase() +
      action.slice(1).toLowerCase().replace("_", " ")
    );
  };

  if (selectedLog) {
    const ts = formatTimestamp(selectedLog.timestamp);
    const changes = selectedLog.changes || selectedLog.new_data || {};
    const changeEntries = Object.entries(changes).filter(
      ([k]) => !["_id", "__v", "id", "tenant_id"].includes(k),
    );

    return (
      <div className="er-container">
        <style>{CSS}</style>

        <div
          className="er-card"
          style={{
            padding: "40px",
            maxWidth: "800px",
            margin: "0 auto",
            animation: "erFadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
              paddingBottom: "20px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <h2 className="er-title" style={{ fontSize: "20px" }}>
              Event Record Details
            </h2>
            <button
              className="er-back-btn"
              onClick={() => setSelectedLog(null)}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              ← Back to List
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Action
              </label>
              <div
                style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}
              >
                {formatAction(selectedLog.action_type)}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Module
              </label>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "capitalize",
                }}
              >
                {selectedLog.module_name}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Executed By
              </label>
              <div
                style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}
              >
                {selectedLog.user_name}
              </div>
              <div
                style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}
              >
                {selectedLog.user_role}
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Timestamp
              </label>
              <div
                style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}
              >
                {ts.date}
              </div>
              <div
                style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}
              >
                {ts.time}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#4f46e5",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Description
            </label>
            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                color: "#475569",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              {selectedLog.description}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#4f46e5",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Data Snapshot
            </label>
            <div
              style={{
                background: "#0f172a",
                padding: "24px",
                borderRadius: "14px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {changeEntries.length === 0 ? (
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  No deep data captured for this event.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {changeEntries.map(([key, val]) => (
                      <tr key={key}>
                        <td
                          style={{
                            padding: "8px 0",
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            width: "120px",
                            verticalAlign: "top",
                          }}
                        >
                          {key}
                        </td>
                        <td
                          style={{
                            padding: "8px 0",
                            color: "#e2e8f0",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                          }}
                        >
                          {typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="er-container">
      <style>{CSS}</style>

      <div className="er-header">
        <div className="er-title-group">
          <h1 className="er-title">Event Register</h1>
          <p className="er-subtitle">
            Secure audit trail and employee lifecycle tracking
          </p>
        </div>
      </div>

      <div
        className="er-filter-bar"
        style={{
          borderRadius: "16px 16px 0 0",
          border: "1px solid #e2e8f0",
          gap: "12px",
        }}
      >
        <div className="er-search-wrap">
          <div className="er-search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search logs..."
            className="er-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            name="module_name"
            className="er-filter-sel"
            value={filters.module_name}
            onChange={handleFilterChange}
          >
            <option value="">All Modules</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {MODULE_MAP[m] || m}
              </option>
            ))}
          </select>
          <select
            name="action_type"
            className="er-filter-sel"
            value={filters.action_type}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {formatAction(a)}
              </option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <input
              type="date"
              className="er-filter-sel"
              style={{ width: "150px" }}
              value={filters.date_from}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setFilters((prev) => ({
                    ...prev,
                    date_from: "",
                    date_to: "",
                  }));
                } else {
                  // Filter for the specific day by setting range from 00:00 to 23:59
                  setFilters((prev) => ({
                    ...prev,
                    date_from: val,
                    date_to: `${val}T23:59:59`,
                  }));
                }
              }}
            />
          </div>

          {(filters.module_name ||
            filters.action_type ||
            filters.date_from ||
            filters.search) && (
            <button
              onClick={() => {
                setSearchValue("");
                setFilters({
                  module_name: "",
                  action_type: "",
                  date_from: "",
                  date_to: "",
                  search: "",
                });
              }}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="er-filter-count">{logs.length} Records</div>
      </div>

      <div
        className="er-card"
        style={{ borderRadius: "0 0 16px 16px", borderTop: "none" }}
      >
        <table className="er-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Module</th>
              <th>Action</th>
              <th>Executed By</th>
              <th>Description</th>
              <th style={{ textAlign: "center" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="er-empty">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="er-empty">
                  No records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const ts = formatTimestamp(log.timestamp);
                return (
                  <tr key={log.id}>
                    <td className="er-tl-time">
                      {ts.date} <br />{" "}
                      <small style={{ opacity: 0.6 }}>{ts.time}</small>
                    </td>
                    <td>
                      <span
                        className="er-badge-module"
                        style={{
                          background: "#f8fafc",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {MODULE_MAP[log.module_name] || log.module_name}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`er-badge-action er-action-${log.action_type.toLowerCase()}`}
                      >
                        {formatAction(log.action_type)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>
                        {log.user_role}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {log.user_name}
                      </div>
                    </td>
                    <td style={{ color: "#475569", maxWidth: "300px" }}>
                      {log.description}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="er-btn-view"
                        onClick={() => setSelectedLog(log)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
