import { Leave, LeaveBalance } from "../../../../types";
import { formatDateForDisplay } from "../../../../utils/dateUtils";

interface LeavesTabProps {
  leavesData: { leaves: { items: Leave[] } } | undefined;
  setShowApplyModal: (val: boolean) => void;
  leaveTypes: { name: string; total_days: number }[];
  leaveBalances: LeaveBalance[] | undefined;
}

export default function LeavesTab({
  leavesData,
  setShowApplyModal,
  leaveTypes: initialLeaveTypes,
  leaveBalances,
}: LeavesTabProps) {
  const getLeaveCode = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("casual")) return "CL";
    if (n.includes("official duty")) return "OOD";
    if (n.includes("sick")) return "SL";
    if (n.includes("paid")) return "PL";
    if (n.includes("maternity") || n.includes("meternity")) return "ML";
    if (n.includes("paternity")) return "Pat_L";
    return name;
  };

  const getLeaveName = (type: string) => {
    const code = getLeaveCode(type);
    const names: Record<string, string> = {
      CL: "Casual Leave",
      OOD: "On Official Duty",
      SL: "Sick Leave",
      PL: "Paid Leave",
      ML: "Maternity Leave",
      Pat_L: "Paternity Leave",
    };
    return names[code] || type;
  };

  const getLeaveMeta = (code: string) => {
    const meta: Record<string, { bg: string; color: string }> = {
      CL: { bg: "#eff6ff", color: "#1d4ed8" },
      OOD: { bg: "#f0fdff", color: "#0891b2" },
      SL: { bg: "#fffbeb", color: "#b45309" },
      PL: { bg: "#f0fdf4", color: "#15803d" },
      ML: { bg: "#fdf2f8", color: "#db2777" },
      Pat_L: { bg: "#f5f3ff", color: "#7c3aed" },
      Other: { bg: "#f8fafc", color: "#64748b" },
    };
    return meta[code] || meta["Other"];
  };

  const getUsedCount = (typeName: string, leaves: Leave[] = []) => {
    const targetCode = getLeaveCode(typeName);
    return leaves
      .filter(
        (l: Leave) =>
          getLeaveCode(l.leave_type) === targetCode &&
          (l.status || "").toLowerCase() === "approved",
      )
      .reduce((sum: number, l: Leave) => sum + (l.total_days || 0), 0);
  };

  const leaveTypes = initialLeaveTypes || [];

  return (
    <>
      <div style={{ width: "100%" }}>
        <div className="ed-leave-grid">
          {leaveTypes.map((lt: { name: string; total_days: number }) => {
            const code = getLeaveCode(lt.name);
            const meta = getLeaveMeta(code);
            const used = getUsedCount(lt.name, leavesData?.leaves?.items || []);

            // Use direct balance from backend if available, otherwise calculate
            const directBalance = leaveBalances?.find(
              (lb: LeaveBalance) => getLeaveCode(lb.leave_type) === code,
            )?.balance;

            const balance =
              directBalance !== undefined
                ? directBalance
                : (lt.total_days || 0) - used;

            return (
              <div key={lt.name} className="ed-leave-card">
                <div
                  className="ed-leave-icon"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {code}
                </div>
                <div className="ed-leave-info">
                  <div className="ed-leave-type">{getLeaveName(lt.name)}</div>
                  <div className="ed-leave-stats">Bal: {balance}</div>
                  <div className="ed-leave-used">
                    Used: <span className="ed-used-val">{used}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ed-filter-bar">
          <div className="ed-filter-item">
            <label className="ed-filter-label">Leave Type</label>
            <select className="ed-select">
              <option>All</option>
              {leaveTypes.map((lt: { name: string; total_days: number }) => (
                <option key={lt.name} value={lt.name}>
                  {getLeaveName(lt.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="ed-filter-item">
            <label className="ed-filter-label">Status</label>
            <select className="ed-select">
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
          <div className="ed-filter-item">
            <label className="ed-filter-label">Start</label>
            <input type="date" className="ed-date-input" />
          </div>
          <div style={{ color: "#94a3b8" }}>—</div>
          <div className="ed-filter-item">
            <label className="ed-filter-label">End</label>
            <input type="date" className="ed-date-input" />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              className="ed-btn ed-btn-primary"
              onClick={() => setShowApplyModal(true)}
            >
              Apply Leaves
            </button>
          </div>
        </div>

        <div className="ed-section" style={{ overflowX: "auto" }}>
          <table className="ed-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Leave Date</th>
                <th>No of days Requested</th>
                <th>Document</th>
                <th>Requested date</th>
                <th>Dept Admin approval</th>
                <th>Admin approval</th>
                <th>Leave status</th>
              </tr>
            </thead>
            <tbody>
              {leavesData?.leaves?.items?.map((l: Leave) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 800,
                        }}
                      >
                        {getLeaveCode(l.leave_type)}
                      </span>
                      {getLeaveName(l.leave_type)}
                    </div>
                  </td>
                  <td>
                    {formatDateForDisplay(l.from_date)} -{" "}
                    {formatDateForDisplay(l.to_date)}
                  </td>
                  <td>{l.total_days}</td>
                  <td>
                    {l.document_url ? (
                      <a href={l.document_url} target="_blank" rel="noreferrer">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {formatDateForDisplay(
                      l.requested_date || l.created_at || "",
                    )}
                  </td>
                  <td>
                    <span
                      className="ed-pill"
                      style={{
                        background:
                          l.approvals?.find(
                            (a) => a.role === "HEAD OF DEPARTMENT",
                          )?.status === "approved"
                            ? "#dcfce7"
                            : l.approvals?.find(
                                  (a) => a.role === "HEAD OF DEPARTMENT",
                                )?.status === "rejected"
                              ? "#fee2e2"
                              : "#fef9c3",
                        color:
                          l.approvals?.find(
                            (a) => a.role === "HEAD OF DEPARTMENT",
                          )?.status === "approved"
                            ? "#166534"
                            : l.approvals?.find(
                                  (a) => a.role === "HEAD OF DEPARTMENT",
                                )?.status === "rejected"
                              ? "#991b1b"
                              : "#854d0e",
                      }}
                    >
                      {l.approvals?.find((a) => a.role === "HEAD OF DEPARTMENT")
                        ?.status || "pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="ed-pill"
                      style={{
                        background:
                          l.approvals?.find((a) => a.role === "ADMIN")
                            ?.status === "approved"
                            ? "#dcfce7"
                            : l.approvals?.find((a) => a.role === "ADMIN")
                                  ?.status === "rejected"
                              ? "#fee2e2"
                              : "#fef9c3",
                        color:
                          l.approvals?.find((a) => a.role === "ADMIN")
                            ?.status === "approved"
                            ? "#166534"
                            : l.approvals?.find((a) => a.role === "ADMIN")
                                  ?.status === "rejected"
                              ? "#991b1b"
                              : "#854d0e",
                      }}
                    >
                      {l.approvals?.find((a) => a.role === "ADMIN")?.status ||
                        "pending"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="ed-pill"
                      style={{
                        background:
                          l.status === "approved"
                            ? "#dcfce7"
                            : l.status === "rejected"
                              ? "#fee2e2"
                              : l.status === "closed"
                                ? "#f1f5f9"
                                : "#fef9c3",
                        color:
                          l.status === "approved"
                            ? "#166534"
                            : l.status === "rejected"
                              ? "#991b1b"
                              : l.status === "closed"
                                ? "#475569"
                                : "#854d0e",
                      }}
                    >
                      {l.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!leavesData?.leaves?.items ||
                leavesData.leaves.items.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#94a3b8",
                    }}
                  >
                    No leave applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
