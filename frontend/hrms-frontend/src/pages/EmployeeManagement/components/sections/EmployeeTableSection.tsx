import type { ManagedEmployee } from "../..";

interface EmployeeTableSectionProps {
  employees: ManagedEmployee[];
  onAction: (emp: ManagedEmployee, mode: "view" | "edit") => void;
  isAdmin: boolean;
  helpers: {
    getInitials: (first: string, last: string) => string;
  };
}

export default function EmployeeTableSection({
  employees,
  onAction,
  isAdmin,
  helpers,
}: EmployeeTableSectionProps) {
  return (
    <div className="em-table-wrap">
      <table className="em-table">
        <thead>
          <tr>
            <th>Dept & Designation</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <div className="em-emp-cell">
                  <div
                    className="em-avatar"
                    style={{ background: emp.avatarColor }}
                  >
                    {helpers.getInitials(emp.firstName, emp.lastName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {emp.empId}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{emp.hrDepartment}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {emp.designation}
                </div>
              </td>
              <td>{emp.employmentType}</td>
              <td>
                <span
                  className={`em-badge ${
                    emp.status === "Active"
                      ? "em-status-active"
                      : "em-status-leave"
                  }`}
                >
                  {emp.status}
                </span>
              </td>
              <td>
                <div className="em-actions">
                  <button
                    className="em-act-btn"
                    title="View Profile"
                    onClick={() => onAction(emp, "view")}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  {isAdmin && (
                    <button
                      className="em-act-btn"
                      title="Edit Profile"
                      onClick={() => onAction(emp, "edit")}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#94a3b8",
                }}
              >
                No employees found matching the filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
