interface EmployeeHeaderSectionProps {
  totalCount: number;
  activeCount: number;
  onLeaveCount: number;
}

export default function EmployeeHeaderSection({
  totalCount,
  activeCount,
  onLeaveCount,
}: EmployeeHeaderSectionProps) {
  return (
    <>
      <div className="em-header">
        <h1 className="em-title">Employee Management</h1>
        <p className="em-subtitle">
          View and manage all organization resources
        </p>
      </div>

      <div className="em-stats">
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{ background: "#eff6ff" }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="em-stat-val">{totalCount}</div>
            <div className="em-stat-lbl">Total Employees</div>
          </div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{ background: "#f0fdf4" }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="em-stat-val">{activeCount}</div>
            <div className="em-stat-lbl">Active Now</div>
          </div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{ background: "#fffbeb" }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b45309"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div className="em-stat-val">{onLeaveCount}</div>
            <div className="em-stat-lbl">On Leave</div>
          </div>
        </div>
      </div>
    </>
  );
}
