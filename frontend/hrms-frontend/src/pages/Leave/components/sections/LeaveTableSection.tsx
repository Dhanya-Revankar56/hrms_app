import type { Leave } from "../../../../types";

interface LeaveTableSectionProps {
  requests: Leave[];
  selectedItems: string[];
  sort: {
    field: string;
    dir: "asc" | "desc";
  };
  actions: {
    onSort: (field: string) => void;
    onToggleSelect: (id: string) => void;
    onToggleAll: () => void;
    onViewDetails: (req: Leave) => void;
  };
  helpers: {
    getLeaveCode: (type: string) => string;
    getLeaveName: (type: string) => string;
    formatDate: (iso: string) => string;
    LEAVE_TYPE_META: Record<string, { bg: string; color: string }>;
  };
  components: {
    OverallStatusBadge: React.ComponentType<{ req: Leave }>;
    StepBadge: React.ComponentType<{ status: string }>;
  };
}

export default function LeaveTableSection({
  requests,
  selectedItems,
  sort,
  actions,
  helpers,
  components: { OverallStatusBadge, StepBadge },
}: LeaveTableSectionProps) {
  const { getLeaveCode, getLeaveName, formatDate, LEAVE_TYPE_META } = helpers;

  return (
    <div className="lv-table-wrap">
      <table className="lv-table">
        <thead>
          <tr>
            <th style={{ width: 40, paddingLeft: 16 }}>
              <input
                type="checkbox"
                className="lv-cb"
                checked={
                  selectedItems.length === requests.length &&
                  requests.length > 0
                }
                onChange={actions.onToggleAll}
              />
            </th>
            <th
              onClick={() => actions.onSort("name")}
              className={sort.field === "name" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                Employee{" "}
                {sort.field === "name" && (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
            <th
              onClick={() => actions.onSort("leaveType")}
              className={sort.field === "leaveType" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                Leave Type{" "}
                {sort.field === "leaveType" && (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
            <th
              onClick={() => actions.onSort("startDate")}
              className={sort.field === "startDate" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                Leave Date{" "}
                {sort.field === "startDate" && (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
            <th>Days</th>
            <th>Document</th>
            <th
              onClick={() => actions.onSort("deptStatus")}
              className={sort.field === "deptStatus" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                Dept Status{" "}
                {sort.field === "deptStatus" &&
                  (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
            <th
              onClick={() => actions.onSort("hrStatus")}
              className={sort.field === "hrStatus" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                HR Status{" "}
                {sort.field === "hrStatus" && (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
            <th
              onClick={() => actions.onSort("finalStatus")}
              className={sort.field === "finalStatus" ? "lv-sorted" : ""}
            >
              <div className="lv-th-inner">
                Final Result{" "}
                {sort.field === "finalStatus" &&
                  (sort.dir === "asc" ? "↑" : "↓")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={12}>
                <div className="lv-empty">
                  <div className="lv-empty-icon">
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
                  <p>No leave requests found</p>
                  <span>Try adjusting your filters or search terms.</span>
                </div>
              </td>
            </tr>
          ) : (
            requests.map((req: Leave, idx: number) => (
              <tr
                key={req.id}
                className="lv-row-in"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <td style={{ paddingLeft: 16 }}>
                  <input
                    type="checkbox"
                    className="lv-cb"
                    checked={selectedItems.includes(req.id)}
                    onChange={() => actions.onToggleSelect(req.id)}
                  />
                </td>
                <td
                  onClick={() => actions.onViewDetails(req)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="lv-emp-cell">
                    <div>
                      <div className="lv-emp-name">
                        {req.employee?.first_name} {req.employee?.last_name}
                      </div>
                      <div className="lv-emp-id">
                        {req.employee_code || req.employee?.employee_id || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="lv-type-tag"
                    style={{
                      background:
                        LEAVE_TYPE_META[getLeaveCode(req.leave_type)]?.bg ||
                        "#f8fafc",
                      color:
                        LEAVE_TYPE_META[getLeaveCode(req.leave_type)]?.color ||
                        "#64748b",
                    }}
                  >
                    <span className="lv-type-abbr">
                      {getLeaveCode(req.leave_type)}
                    </span>
                    {getLeaveName(req.leave_type)}
                  </span>
                </td>
                <td>
                  <div className="lv-date-range">
                    <span className="lv-date-val">
                      {formatDate(req.from_date)}
                    </span>
                    {req.from_date !== req.to_date && (
                      <>
                        <span className="lv-date-sep">-</span>
                        <span className="lv-date-val">
                          {formatDate(req.to_date)}
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="lv-days-cell">
                  {req.total_days}
                  <span className="lv-days-unit">d</span>
                </td>
                <td>
                  <span className="lv-doc-no">—</span>
                </td>
                <td>
                  <StepBadge
                    status={
                      req.approvals?.find(
                        (a) => a.role === "HEAD OF DEPARTMENT",
                      )?.status || "Pending"
                    }
                  />
                </td>
                <td>
                  <StepBadge
                    status={
                      req.approvals?.find((a) => a.role === "ADMIN")?.status ||
                      "Pending"
                    }
                  />
                </td>
                <td>
                  <OverallStatusBadge req={req} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
