interface RelievingStatsSectionProps {
  stats: {
    total: number;
    pending: number;
    clearance: number;
    relieved: number;
  };
}

export default function RelievingStatsSection({
  stats,
}: RelievingStatsSectionProps) {
  const statConfig = [
    {
      label: "Total Exit Requests",
      value: stats.total,
      sub: "All time",
      color: "#1d4ed8",
      bg: "#eff6ff",
    },
    {
      label: "Pending Approvals",
      value: stats.pending,
      sub: "Awaiting HR decision",
      color: "#b45309",
      bg: "#fffbeb",
    },
    {
      label: "Clearance In Progress",
      value: stats.clearance,
      sub: "In exit process",
      color: "#1d4ed8",
      bg: "#eff6ff",
    },
    {
      label: "Employees Relieved",
      value: stats.relieved,
      sub: "Successfully exited",
      color: "#059669",
      bg: "#f0fdf4",
    },
  ] as const;

  return (
    <div className="er-stats">
      {statConfig.map((s) => (
        <div key={s.label} className="er-stat-card">
          <div className="er-stat-icon" style={{ background: s.bg }}>
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke={s.color}
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <div>
            <div className="er-stat-val" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="er-stat-lbl">{s.label}</div>
            <div className="er-stat-sub">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
