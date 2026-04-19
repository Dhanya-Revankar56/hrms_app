interface LeaveStatsSectionProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function LeaveStatsSection({ stats }: LeaveStatsSectionProps) {
  const statItems = [
    {
      label: "Total Requests",
      value: stats.total,
      sub: "All time",
      color: "#1d4ed8",
      bg: "#eff6ff",
    },
    {
      label: "Pending",
      value: stats.pending,
      sub: "Awaiting approval",
      color: "#b45309",
      bg: "#fffbeb",
    },
    {
      label: "Approved",
      value: stats.approved,
      sub: "Fully approved",
      color: "#15803d",
      bg: "#f0fdf4",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      sub: "Leave denied",
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ] as const;

  return (
    <div className="lv-stats">
      {statItems.map((s) => (
        <div key={s.label} className="lv-stat-card">
          <div className="lv-stat-icon" style={{ background: s.bg }}>
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <div className="lv-stat-val" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="lv-stat-lbl">{s.label}</div>
            <div className="lv-stat-sub">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
