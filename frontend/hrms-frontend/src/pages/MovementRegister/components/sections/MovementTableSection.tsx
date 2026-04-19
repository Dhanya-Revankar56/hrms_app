import { Movement } from "../../../../types";

type SortField = "empId" | "empName" | "date" | "status";
type SortDir = "asc" | "desc";

interface MovementTableSectionProps {
  items: Movement[];
  onRowClick: (rec: Movement) => void;
  sortState: {
    sf: SortField;
    sd: SortDir;
  };
  onSort: (f: SortField) => void;
  helpers: {
    fmtDate: (iso: string) => string;
    timeRange: (out: string, ret: string) => string;
  };
  StatusCell: React.ComponentType<{ status?: string }>;
}

function SortIco({ on, dir }: { on: boolean; dir: SortDir }) {
  return (
    <svg
      width="9"
      height="9"
      fill="none"
      viewBox="0 0 24 24"
      stroke={on ? "#4f46e5" : "#d1d5db"}
      strokeWidth={2.5}
    >
      {on && dir === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 10l7-7 7 7m-7-7v18"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 14l-7 7-7-7m7 7V3"
        />
      )}
    </svg>
  );
}

interface SThP {
  field: SortField;
  label: string;
  sf: SortField;
  sd: SortDir;
  onSort: (f: SortField) => void;
}
function STh({ field, label, sf, sd, onSort }: SThP) {
  return (
    <th
      className={sf === field ? "mr-sorted" : ""}
      onClick={() => onSort(field)}
    >
      <div className="mr-th-i">
        {label}
        <SortIco on={sf === field} dir={sd} />
      </div>
    </th>
  );
}

export default function MovementTableSection({
  items,
  onRowClick,
  sortState,
  onSort,
  helpers,
  StatusCell,
}: MovementTableSectionProps) {
  const { sf, sd } = sortState;

  return (
    <div className="mr-card">
      <div className="mr-table-wrap">
        {items.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-ic">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p>No movements found for the selected filters.</p>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>
              Try adjusting your search or category selection.
            </span>
          </div>
        ) : (
          <table className="mr-table">
            <thead>
              <tr>
                <STh
                  field="empId"
                  label="Employee ID"
                  sf={sf}
                  sd={sd}
                  onSort={onSort}
                />
                <STh
                  field="empName"
                  label="Employee Name"
                  sf={sf}
                  sd={sd}
                  onSort={onSort}
                />
                <STh
                  field="date"
                  label="Movement Date"
                  sf={sf}
                  sd={sd}
                  onSort={onSort}
                />
                <th>Movement Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((rec: Movement) => (
                <tr key={rec.id} onClick={() => onRowClick(rec)}>
                  <td>
                    <span className="mr-empid">
                      {rec.employee?.employee_id || rec.employee_code || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="mr-name">
                      {rec.employee?.first_name} {rec.employee?.last_name}
                    </span>
                  </td>
                  <td>
                    <span className="mr-date">
                      {helpers.fmtDate(rec.movement_date)}
                    </span>
                  </td>
                  <td>
                    <span className="mr-time">
                      {helpers.timeRange(rec.out_time, rec.in_time)}
                    </span>
                  </td>
                  <td>
                    <span className="mr-reason">{rec.movement_type}</span>
                  </td>
                  <td>
                    <StatusCell status={rec.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ color: "#94a3b8", cursor: "pointer" }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
