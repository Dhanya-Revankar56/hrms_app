import type { EventLog } from "../../../../types";

const MODULE_MAP: Record<string, string> = {
  employee: "Employee Management",
  onboarding: "Employee Onboarding",
  leave: "Leave Management",
  attendance: "Attendance",
  movement: "Movement Register",
  relieving: "Relieving",
  settings: "Settings",
  holiday: "Holidays",
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
  if (!action) return "Activity";
  if (action.includes("_"))
    return action
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
};

interface EventRegisterTabProps {
  lifecycleLogs: EventLog[];
  lcFilterFrom: string;
  lcFilterTo: string;
  setLcFilterFrom: (val: string) => void;
  setLcFilterTo: (val: string) => void;
  exportLifecycleCsv: () => void;
  lifecycleLoading: boolean;
}

export default function EventRegisterTab({
  lifecycleLogs,
  lcFilterFrom,
  lcFilterTo,
  setLcFilterFrom,
  setLcFilterTo,
  exportLifecycleCsv,
  lifecycleLoading,
}: EventRegisterTabProps) {
  return (
    <>
      <div
        className="ed-section"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        {/* Toolbar for Event Register */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            background: "#fff",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Date From
              </label>
              <input
                type="date"
                value={lcFilterFrom}
                onChange={(e) => setLcFilterFrom(e.target.value)}
                style={{
                  height: "36px",
                  padding: "0 10px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Date To
              </label>
              <input
                type="date"
                value={lcFilterTo}
                onChange={(e) => setLcFilterTo(e.target.value)}
                style={{
                  height: "36px",
                  padding: "0 10px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <button
            onClick={exportLifecycleCsv}
            style={{
              height: "36px",
              padding: "0 16px",
              background: "#eef2ff",
              color: "#4f46e5",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            disabled={lifecycleLogs.length === 0}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export Report
          </button>
        </div>

        {lifecycleLoading ? (
          <div className="er-empty-lc">
            <div className="er-empty-text">Loading event register...</div>
          </div>
        ) : lifecycleLogs.length === 0 ? (
          <div className="er-empty-lc">
            <div className="er-empty-icon">📂</div>
            <div className="er-empty-text">No records found</div>
            <div className="er-empty-sub" style={{ color: "#94a3b8" }}>
              This employee has no registered events yet
            </div>
          </div>
        ) : (
          <div className="er-timeline">
            {lifecycleLogs.map((log) => {
              const ts = formatTimestamp(log.timestamp);
              const isJoined =
                log.action_type === "CREATED" &&
                log.module_name === "onboarding";
              const isRelieved = log.action_type === "RELIEVED";

              return (
                <div
                  key={log.id}
                  className={`er-timeline-item ${isJoined ? "er-item-joined" : ""} ${isRelieved ? "er-item-relieved" : ""}`}
                >
                  <div className="er-timeline-dot">
                    {isJoined ? "🌱" : isRelieved ? "🏁" : "📝"}
                  </div>
                  <div className="er-tl-card">
                    <div className="er-tl-header">
                      <div className="er-tl-action">
                        <span
                          className={`er-badge-action er-action-${log.action_type.toLowerCase()}`}
                          style={{ fontSize: "9px" }}
                        >
                          {MODULE_MAP[log.module_name] || log.module_name}
                        </span>
                        {formatAction(log.action_type)}
                      </div>
                    </div>
                    <p className="er-tl-desc">{log.description}</p>
                    <div className="er-tl-meta">
                      <div className="er-tl-user">
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 110-8 4 4 0 010 8z" />
                        </svg>
                        Executed by:{" "}
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          {log.user_role}
                        </span>{" "}
                        ({log.user_name})
                      </div>
                      <div className="er-tl-time">
                        🕒 {ts.date} at {ts.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
