import type { Movement } from "../../../../types";
import { formatDateForDisplay } from "../../../../utils/dateUtils";

interface MovementsTabProps {
  movementsData: { movements: { items: Movement[] } } | undefined;
  setShowMovementModal: (val: boolean) => void;
}

export default function MovementsTab({
  movementsData,
  setShowMovementModal,
}: MovementsTabProps) {
  const to12 = (t: string): string => {
    if (!t) return "—";
    const parts = t.split(":").map(Number);
    const h = parts[0];
    const m = parts[1];
    const period = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
  };
  return (
    <>
      <div style={{ width: "100%" }}>
        <div className="ed-filter-bar" style={{ marginBottom: 20 }}>
          <div className="ed-filter-item">
            <label className="ed-filter-label">Status Filter</label>
            <select className="ed-select">
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              className="ed-btn ed-btn-primary"
              onClick={() => setShowMovementModal(true)}
            >
              Apply Movement
            </button>
          </div>
        </div>

        <div className="ed-section" style={{ overflowX: "auto" }}>
          <h2 className="ed-sec-title">Movement Log</h2>
          <table className="ed-table">
            <thead>
              <tr>
                <th>Movement Date</th>
                <th>Reason</th>
                <th>Time Range</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {movementsData?.movements?.items?.map((m: Movement) => (
                <tr key={m.id}>
                  <td>{formatDateForDisplay(m.movement_date)}</td>
                  <td>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "#f1f5f9",
                        color: "#64748b",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {m.movement_type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {to12(m.out_time)} - {m.in_time ? to12(m.in_time) : "..."}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`ed-pill ed-status-${(m.status || "pending").toLowerCase()}`}
                    >
                      {m.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!movementsData?.movements?.items ||
                movementsData.movements.items.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: "#94a3b8",
                    }}
                  >
                    No movement records found.
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
