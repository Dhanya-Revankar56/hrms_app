interface LeaveHeaderSectionProps {
  onExport: () => void;
}

export default function LeaveHeaderSection({
  onExport,
}: LeaveHeaderSectionProps) {
  return (
    <div className="lv-header">
      <div>
        <h1 className="lv-title">Leave Management</h1>
        <p className="lv-sub">
          Manage employee leave requests through the two-step approval workflow.
        </p>
      </div>
      <div className="lv-header-actions">
        <button className="lv-header-btn" onClick={onExport}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
          Export Report
        </button>
      </div>
    </div>
  );
}
