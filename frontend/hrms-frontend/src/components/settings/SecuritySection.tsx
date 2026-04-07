import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CHANGE_PASSWORD } from "../../graphql/authQueries";

export default function SecuritySection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      setMessage({ type: "error", text: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    changePassword({ variables: { oldPassword, newPassword } });
  };

  return (
    <div className="security-wrapper">
      <style>{`
        .security-wrapper {
          padding: 24px;
          max-width: 1000px;
        }

        .security-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          width: 100%;
        }

        .security-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .security-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .security-desc {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 4px;
        }

        .security-body {
          padding: 24px;
        }

        .security-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 400px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 10px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-input {
          width: 100%;
          height: 38px;
          padding: 0 12px 0 36px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #0f172a;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input::placeholder {
          color: #cbd5e1;
        }

        .submit-btn {
          width: fit-content;
          height: 36px;
          padding: 0 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .message-box {
          margin-bottom: 24px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .message-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .security-card {
            background: #1e293b;
            border-color: #334155;
          }
          .security-header {
            border-bottom-color: #334155;
          }
          .security-title {
            color: #f1f5f9;
          }
          .security-desc {
            color: #94a3b8;
          }
          .form-label {
            color: #94a3b8;
          }
          .form-input {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
          }
          .form-input:focus {
            background: #0f172a;
            border-color: #3b82f6;
          }
          .message-success {
            background: rgba(22, 101, 52, 0.1);
            border-color: rgba(34, 197, 94, 0.2);
          }
          .message-error {
            background: rgba(153, 27, 27, 0.1);
            border-color: rgba(239, 68, 68, 0.2);
          }
        }
      `}</style>

      <div className="security-card">
        <div className="security-header">
          <h2 className="security-title">Change Password</h2>
          <p className="security-desc">We recommend using a strong password that you're not using elsewhere.</p>
        </div>

        <div className="security-body">
          {message && (
            <div className={`message-box message-${message.type}`}>
               {message.type === 'success' ? (
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
               ) : (
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
               )}
               {message.text}
            </div>
          )}

          <form className="security-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </span>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </span>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
