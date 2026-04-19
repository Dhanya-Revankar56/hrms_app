import React from "react";

interface UpdateAttendanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  updateStatusValue: string;
  setUpdateStatusValue: (val: string) => void;
}

export default function UpdateAttendanceStatusModal({
  isOpen,
  onClose,
  onSubmit,
  updateStatusValue,
  setUpdateStatusValue,
}: UpdateAttendanceStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay" onClick={onClose}>
      <div
        className="ed-modal-card"
        style={{ maxWidth: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ed-details-header" style={{ marginBottom: 20 }}>
          <div className="ed-details-title">Update Attendance Status</div>
        </div>

        <div className="ed-modal-body" style={{ padding: 0 }}>
          <div
            className="ed-modal-field"
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              alignItems: "center",
              gap: 20,
            }}
          >
            <label className="ed-modal-label" style={{ marginBottom: 0 }}>
              Status
            </label>
            <select
              className="ed-modal-select"
              value={updateStatusValue}
              onChange={(e) => setUpdateStatusValue(e.target.value)}
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="WEEK_OFF">Week Off</option>
            </select>
          </div>

          <div className="ed-status-modal-note">
            <span>Note:</span>
            <p>
              This model updates data in batches, so it may not reflect the
              latest information immediately. Please wait for a few minutes or
              check back later for the updated results.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            justifyContent: "flex-end",
          }}
        >
          <button
            className="ed-btn"
            style={{ minWidth: 100, justifyContent: "center" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="ed-btn"
            style={{
              minWidth: 100,
              justifyContent: "center",
              background: "#00264d",
              color: "#fff",
            }}
            onClick={onSubmit}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
