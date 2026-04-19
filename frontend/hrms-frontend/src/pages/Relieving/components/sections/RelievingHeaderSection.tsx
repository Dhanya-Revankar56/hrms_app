interface RelievingHeaderSectionProps {
  isAdmin: boolean;
  onExport: () => void;
  onRecordExit: () => void;
}

export default function RelievingHeaderSection({
  isAdmin,
  onExport,
  onRecordExit,
}: RelievingHeaderSectionProps) {
  return (
    <div className="er-header">
      <div>
        <h1 className="er-title">Employee Relieving</h1>
        <p className="er-sub">
          Manage employee exits, resignation approvals, clearances, and final
          settlements.
        </p>
      </div>
      {isAdmin && (
        <div className="er-header-actions">
          <button className="er-header-btn" onClick={onExport}>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Report
          </button>
          <button
            className="er-header-btn er-header-btn-primary"
            onClick={onRecordExit}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Record Exit
          </button>
        </div>
      )}
    </div>
  );
}
