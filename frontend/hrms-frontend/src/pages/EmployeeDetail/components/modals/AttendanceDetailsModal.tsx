import React from "react";

interface AttendanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDetailsDate: string | null;
  formatDateForDisplay: (date: string) => string;
}

export default function AttendanceDetailsModal({
  isOpen,
  onClose,
  selectedDetailsDate,
  formatDateForDisplay,
}: AttendanceDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay" onClick={onClose}>
      <div
        className="ed-modal-card"
        style={{ maxWidth: 650 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ed-details-header">
          <div className="ed-details-title">
            Attendance Details of{" "}
            {selectedDetailsDate
              ? formatDateForDisplay(selectedDetailsDate)
              : ""}
          </div>
        </div>

        <div className="ed-details-section">
          <div className="ed-details-sec-title">Session Details</div>
          <div className="ed-details-grid">
            <div className="ed-details-row">
              <span className="ed-details-label">Check in</span>
              <span className="ed-details-time">-</span>
              <span className="ed-details-status">To be marked</span>
            </div>
            <div className="ed-details-row">
              <span className="ed-details-label">II</span>
              <span className="ed-details-time">-</span>
              <span className="ed-details-status">To be marked</span>
            </div>
            <div className="ed-details-row">
              <span className="ed-details-label">III</span>
              <span className="ed-details-time">-</span>
              <span className="ed-details-status">To be marked</span>
            </div>
            <div className="ed-details-row">
              <span className="ed-details-label">Check out</span>
              <span className="ed-details-time">-</span>
              <span className="ed-details-status">To be marked</span>
            </div>
          </div>
        </div>

        <div className="ed-details-punch-link">View Punch Details</div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 32,
          }}
        >
          <button
            className="ed-btn"
            style={{ minWidth: 100, justifyContent: "center" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
