interface ApplyMovementForm {
  movement_date: string;
  movement_type: string;
  out_time: string;
  in_time: string;
  purpose: string;
  remarks: string;
}

interface ApplyMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  moveForm: ApplyMovementForm;
  setMoveForm: (form: ApplyMovementForm) => void;
  mStatus: { type: "success" | "error"; message: string } | null;
  mLoading: boolean;
  showOut: boolean;
  setShowOut: (v: boolean) => void;
  showRet: boolean;
  setShowRet: (v: boolean) => void;
  to12: (t: string) => string;
  tdiff: (a: string, b: string) => string;
}

export default function ApplyMovementModal({
  isOpen,
  onClose,
  onSubmit,
  moveForm,
  setMoveForm,
  mStatus,
  mLoading,
  showOut,
  setShowOut,
  showRet,
  setShowRet,
  to12,
  tdiff,
}: ApplyMovementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay">
      <div className="ed-modal" style={{ width: 500 }}>
        <div className="ed-modal-head">
          <div className="ed-modal-title">Apply Movement</div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
            }}
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ed-modal-body">
          {mStatus && (
            <div className={`ed-alert ed-alert-${mStatus.type}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                {mStatus.type === "error" ? (
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                ) : (
                  <path d="M20 6L9 17l-5-5" />
                )}
              </svg>
              {mStatus.message}
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div className="ed-filter-item">
              <label className="ed-filter-label">
                Movement Date <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="date"
                className="ed-date-input"
                value={moveForm.movement_date}
                onChange={(e) =>
                  setMoveForm({ ...moveForm, movement_date: e.target.value })
                }
              />
            </div>
            <div className="ed-filter-item">
              <label className="ed-filter-label">
                Type <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="ed-select"
                value={moveForm.movement_type}
                onChange={(e) =>
                  setMoveForm({ ...moveForm, movement_type: e.target.value })
                }
              >
                <option value="official">Official</option>
                <option value="personal">Personal</option>
                <option value="Exam Duty">Exam Duty</option>
                <option value="Bank Visit">Bank Visit</option>
                <option value="Medical Appointment">Medical Appointment</option>
                <option value="Outside Meeting">Outside Meeting</option>
                <option value="Personal Emergency">Personal Emergency</option>
                <option value="Official Field Work">Official Field Work</option>
                <option value="Government Office">Government Office</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            <div className="ed-filter-item">
              <label className="ed-filter-label">
                Out Time <span style={{ color: "red" }}>*</span>
              </label>
              <div className="ed-time-trigger" onClick={() => setShowOut(true)}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {to12(moveForm.out_time)}
              </div>
              {showOut && (
                <AnalogTimePicker
                  initialTime={moveForm.out_time || "09:00"}
                  onSave={(t) => {
                    setMoveForm({ ...moveForm, out_time: t });
                    setShowOut(false);
                  }}
                  onCancel={() => setShowOut(false)}
                />
              )}
            </div>
            <div className="ed-filter-item">
              <label className="ed-filter-label">
                Return By <span style={{ color: "red" }}>*</span>
              </label>
              <div className="ed-time-trigger" onClick={() => setShowRet(true)}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {to12(moveForm.in_time)}
              </div>
              {showRet && (
                <AnalogTimePicker
                  initialTime={moveForm.in_time || "10:00"}
                  onSave={(t) => {
                    setMoveForm({ ...moveForm, in_time: t });
                    setShowRet(false);
                  }}
                  onCancel={() => setShowRet(false)}
                />
              )}
            </div>
            <div className="ed-filter-item">
              <label className="ed-filter-label">Duration</label>
              <div
                style={{
                  height: 36,
                  padding: "0 10px",
                  background: "#eff6ff",
                  border: "1.5px solid #dbeafe",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1d4ed8",
                }}
              >
                {tdiff(moveForm.out_time, moveForm.in_time)}
              </div>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div className="ed-filter-item">
              <label className="ed-filter-label">
                Purpose <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                className="ed-select"
                style={{ height: 60, padding: 10, resize: "none" }}
                value={moveForm.purpose}
                onChange={(e) =>
                  setMoveForm({ ...moveForm, purpose: e.target.value })
                }
                placeholder="Describe the reason for movement..."
              ></textarea>
            </div>
            <div className="ed-filter-item">
              <label className="ed-filter-label">Remarks</label>
              <textarea
                className="ed-select"
                style={{ height: 60, padding: 10, resize: "none" }}
                value={moveForm.remarks}
                onChange={(e) =>
                  setMoveForm({ ...moveForm, remarks: e.target.value })
                }
                placeholder="Additional notes..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="ed-modal-foot">
          <button className="ed-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ed-btn ed-btn-primary"
            disabled={mLoading}
            onClick={onSubmit}
          >
            {mLoading ? "Submitting..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
