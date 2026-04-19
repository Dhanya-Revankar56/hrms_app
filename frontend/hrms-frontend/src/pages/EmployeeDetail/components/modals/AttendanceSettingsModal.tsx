interface AttendanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  biometricId: string;
  setBiometricId: (val: string) => void;
  selectedShift: string;
  setSelectedShift: (val: string) => void;
}

export default function AttendanceSettingsModal({
  isOpen,
  onClose,
  biometricId,
  setBiometricId,
  selectedShift,
  setSelectedShift,
}: AttendanceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ed-modal-overlay" onClick={onClose}>
      <div className="ed-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ed-modal-field">
          <label className="ed-modal-label">Biometric ID</label>
          <input
            className="ed-modal-input"
            value={biometricId}
            onChange={(e) => setBiometricId(e.target.value)}
          />
        </div>

        <div className="ed-modal-field">
          <label className="ed-modal-label">Select Shift</label>
          <select
            className="ed-modal-select"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="Teaching Staff">Teaching Staff</option>
            <option value="Admin Staff">Admin Staff</option>
          </select>
        </div>

        <div className="ed-face-setup">
          <span className="ed-face-label">Face ID Setup</span>
          <div className="ed-face-icons">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
        </div>

        <div
          style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}
        >
          <button className="ed-btn ed-btn-primary" onClick={onClose}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
