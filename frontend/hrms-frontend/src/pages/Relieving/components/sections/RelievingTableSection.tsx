import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pending Approval": "er-badge er-badge-pending",
    Approved: "er-badge er-badge-approved",
    "Clearance In Progress": "er-badge er-badge-clearance",
    Relieved: "er-badge er-badge-relieved",
    Rejected: "er-badge er-badge-rejected",
  };
  return <span className={map[status] || "er-badge"}>{status}</span>;
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <svg
      width="10"
      height="10"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? "#1d4ed8" : "#cbd5e1"}
      strokeWidth={2.5}
    >
      {active && dir === "asc" ? (
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

function SortTh({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: string;
  label: string;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  return (
    <th
      className={sortField === field ? "er-sorted" : ""}
      onClick={() => onSort(field)}
    >
      <div className="er-th-inner">
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </div>
    </th>
  );
}

function DotsMenu({
  rec,
  onView,
  onApprove,
  onReject,
  onRelieve,
}: {
  rec: RelievingRecord;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRelieve: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      className="er-dots-wrap"
      ref={wrapRef}
      style={{ zIndex: open ? 2000 : 1 }}
    >
      <button
        className="er-dots-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="12" cy="19" r="2.5" />
        </svg>
      </button>
      {open && (
        <div className="er-dots-menu">
          <button
            className="er-dots-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onView();
            }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>

          {rec.status === "Pending Approval" && (
            <>
              <div className="er-dots-divider" />
              <button
                className="er-dots-item approve"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onApprove();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve Request
              </button>
              <button
                className="er-dots-item reject"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onReject();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject Request
              </button>
            </>
          )}

          {rec.status === "Clearance In Progress" && (
            <>
              <div className="er-dots-divider" />
              <button
                className="er-dots-item relieve"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onRelieve();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Final Relieving
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN SECTION COMPONENT
───────────────────────────────────────────── */
interface RelievingRecord {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  department: string;
  designation: string;
  lastWorkingDay: string;
  status: string;
  avatarColor: string;
}

interface RelievingTableSectionProps {
  records: RelievingRecord[];
  sort: { field: string; dir: "asc" | "desc" };
  onSort: (field: string) => void;
  helpers: {
    getInitials: (f: string, l: string) => string;
    formatDate: (d: string) => string;
  };
  actions: {
    onView: (rec: RelievingRecord) => void;
    onApprove: (rec: RelievingRecord) => void;
    onReject: (rec: RelievingRecord) => void;
    onRelieve: (rec: RelievingRecord) => void;
  };
}

export default function RelievingTableSection({
  records,
  sort,
  onSort,
  helpers,
  actions,
}: RelievingTableSectionProps) {
  return (
    <div className="er-table-wrap">
      {records.length === 0 ? (
        <div className="er-empty">
          <div className="er-empty-icon">
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <p>No exit records found</p>
          <span>Try adjusting the filters or record a new exit.</span>
        </div>
      ) : (
        <table className="er-table">
          <thead>
            <tr>
              <SortTh
                field="empId"
                label="Emp ID"
                sortField={sort.field}
                sortDir={sort.dir}
                onSort={onSort}
              />
              <SortTh
                field="name"
                label="Employee"
                sortField={sort.field}
                sortDir={sort.dir}
                onSort={onSort}
              />
              <SortTh
                field="department"
                label="Department"
                sortField={sort.field}
                sortDir={sort.dir}
                onSort={onSort}
              />
              <th>Designation</th>
              <SortTh
                field="lastDay"
                label="Relieving Date"
                sortField={sort.field}
                sortDir={sort.dir}
                onSort={onSort}
              />
              <SortTh
                field="status"
                label="Status"
                sortField={sort.field}
                sortDir={sort.dir}
                onSort={onSort}
              />
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec: RelievingRecord, idx: number) => (
              <tr key={rec.id} className={idx < 5 ? "er-row-in" : ""}>
                <td>
                  <span className="er-emp-id">{rec.empId}</span>
                </td>
                <td>
                  <div className="er-emp-cell">
                    <div
                      className="er-emp-av"
                      style={{ background: rec.avatarColor }}
                    >
                      {helpers.getInitials(rec.firstName, rec.lastName)}
                    </div>
                    <div>
                      <div className="er-emp-name">
                        {rec.firstName} {rec.lastName}
                      </div>
                      <div className="er-emp-sub">{rec.officialEmail}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="er-dept-pill">{rec.department}</span>
                </td>
                <td>
                  <span className="er-desig">{rec.designation}</span>
                </td>
                <td>
                  <span className="er-date-val">
                    {helpers.formatDate(rec.lastWorkingDay)}
                  </span>
                </td>
                <td>
                  <StatusBadge status={rec.status} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <DotsMenu
                    rec={rec}
                    onView={() => actions.onView(rec)}
                    onApprove={() => actions.onApprove(rec)}
                    onReject={() => actions.onReject(rec)}
                    onRelieve={() => actions.onRelieve(rec)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
