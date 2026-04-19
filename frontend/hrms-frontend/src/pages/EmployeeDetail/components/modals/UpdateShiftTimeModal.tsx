import React from "react";

interface UpdateShiftTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedSession: string;
  setSelectedSession: (val: string) => void;
  updateReason: string;
  setUpdateReason: (val: string) => void;
}

export default function UpdateShiftTimeModal({
  isOpen,
  onClose,
  onSubmit,
  selectedSession,
  setSelectedSession,
  updateReason,
  setUpdateReason,
}: UpdateShiftTimeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay" onClick={onClose}>
      <div
        className="ed-modal-card"
        style={{ maxWidth: 550 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ed-details-header" style={{ marginBottom: 20 }}>
          <div className="ed-details-title">Update Shift Time</div>
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
              Session
            </label>
            <select
              className="ed-modal-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="Check In">Check In</option>
              <option value="Intermediate 1">Intermediate 1</option>
              <option value="Intermediate 2">Intermediate 2</option>
              <option value="Check Out">Check Out</option>
            </select>
          </div>

          <div
            className="ed-modal-field"
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <label className="ed-modal-label" style={{ marginTop: 12 }}>
              Reason
            </label>
            <textarea
              className="ed-modal-input"
              style={{ height: 60, padding: 10, resize: "none" }}
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              placeholder="Reason for change..."
            ></textarea>
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
