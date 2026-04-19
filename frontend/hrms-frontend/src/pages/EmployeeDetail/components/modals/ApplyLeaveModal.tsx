interface ApplyLeaveForm {
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
}

interface ApplyDayData {
  date: string;
  type: string;
}

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  applyForm: ApplyLeaveForm;
  setApplyForm: (form: ApplyLeaveForm) => void;
  status: { type: "success" | "error"; message: string } | null;
  applyDaysData: ApplyDayData[];
  setApplyDaysData: (data: ApplyDayData[]) => void;
  applyTotalDays: number;
  leaveTypes: { name: string; total_days: number }[];
  getLeaveName: (type: string) => string;
  empLoading: boolean;
}

export default function ApplyLeaveModal({
  isOpen,
  onClose,
  onSubmit,
  applyForm,
  setApplyForm,
  status,
  applyDaysData,
  setApplyDaysData,
  applyTotalDays,
  leaveTypes,
  getLeaveName,
  empLoading,
}: ApplyLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay">
      <div className="ed-modal">
        <div className="ed-modal-head">
          <div className="ed-modal-title">Apply Leave</div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
            }}
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ed-modal-body">
          {status && (
            <div className={`ed-alert ed-alert-${status.type}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                {status.type === "error" ? (
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                ) : (
                  <path d="M20 6L9 17l-5-5" />
                )}
              </svg>
              {status.message}
            </div>
          )}

          <div className="ed-filter-item">
            <label className="ed-filter-label">Leave Type</label>
            <select
              className="ed-select"
              value={applyForm.leave_type || leaveTypes[0]?.name || ""}
              onChange={(e) =>
                setApplyForm({ ...applyForm, leave_type: e.target.value })
              }
            >
              {leaveTypes.map((lt) => (
                <option key={lt.name} value={lt.name}>
                  {getLeaveName(lt.name)} ({lt.total_days} days)
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div className="ed-filter-item">
              <label className="ed-filter-label">From Date</label>
              <input
                type="date"
                className="ed-date-input"
                value={applyForm.from_date}
                onChange={(e) =>
                  setApplyForm({ ...applyForm, from_date: e.target.value })
                }
              />
            </div>
            <div className="ed-filter-item">
              <label className="ed-filter-label">To Date</label>
              <input
                type="date"
                className="ed-date-input"
                value={applyForm.to_date}
                onChange={(e) =>
                  setApplyForm({ ...applyForm, to_date: e.target.value })
                }
              />
            </div>
          </div>

          {applyDaysData.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label
                className="ed-filter-label"
                style={{ marginBottom: 8, display: "block" }}
              >
                Daily Breakdown
              </label>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        Leave Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applyDaysData.map((d, i) => (
                      <tr
                        key={d.date}
                        style={{
                          borderBottom:
                            i < applyDaysData.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "#334155",
                            fontWeight: 500,
                          }}
                        >
                          {new Date(d.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <select
                            className="ed-select"
                            style={{ height: 32, fontSize: 12, width: "100%" }}
                            value={d.type}
                            onChange={(e) => {
                              const newList = [...applyDaysData];
                              newList[i].type = e.target.value;
                              setApplyDaysData(newList);
                            }}
                          >
                            <option value="Full Day">Full Day</option>
                            <option value="Half Day Morning">
                              First Half (Morning)
                            </option>
                            <option value="Half Day Afternoon">
                              Second Half (Afternoon)
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    borderTop: "1px solid #e2e8f0",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  <span>Total Leave Duration:</span>
                  <span style={{ color: "#1d4ed8" }}>
                    {applyTotalDays} {applyTotalDays === 1 ? "Day" : "Days"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="ed-filter-item">
            <label className="ed-filter-label">Reason</label>
            <textarea
              className="ed-select"
              style={{ height: 80, padding: 10, resize: "none" }}
              value={applyForm.reason}
              onChange={(e) =>
                setApplyForm({ ...applyForm, reason: e.target.value })
              }
              placeholder="Reason for leave..."
            ></textarea>
          </div>
        </div>

        <div className="ed-modal-foot">
          <button className="ed-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ed-btn ed-btn-primary"
            disabled={empLoading}
            onClick={onSubmit}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}
