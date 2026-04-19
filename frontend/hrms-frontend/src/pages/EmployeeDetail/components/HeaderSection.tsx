import { useNavigate } from "react-router-dom";

import type { Employee } from "../../../types";

interface HeaderSectionProps {
  employee: Employee;
  initials: string;
  forcedTab?: string;
}

export default function HeaderSection({
  employee,
  initials,
  forcedTab,
}: HeaderSectionProps) {
  const navigate = useNavigate();

  return (
    <>
      {!forcedTab && (
        <button className="ed-back-btn" onClick={() => navigate("/employees")}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Employees
        </button>
      )}

      <div className="ed-header-card">
        <div className="ed-avatar-box">{initials}</div>
        <div className="ed-info-main">
          <div className="ed-name-row">
            <h1 className="ed-name">
              {employee.title} {employee.first_name} {employee.last_name}
            </h1>
            <span className="ed-status-badge">{employee.app_status}</span>
          </div>
          <div className="ed-meta">
            <span>{employee.work_detail?.designation?.name || "Staff"}</span>
            <div className="ed-meta-sep" />
            <span>{employee.employee_id}</span>
            <div className="ed-meta-sep" />
            <span>
              {employee.work_detail?.department?.name || "No Department"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
