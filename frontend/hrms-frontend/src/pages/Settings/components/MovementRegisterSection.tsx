// src/components/settings/MovementRegisterSection.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_SETTINGS,
  UPSERT_SETTINGS,
} from "../../../graphql/settingsQueries";

/* ─────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────── */
interface MovementSettings {
  limit_count: number;
  limit_frequency: string;
  max_duration_mins: number;
  days_before_apply: number;
  user_entry: boolean;
  limit_enabled: boolean;
}

/* ─────────────────────────────────────────────
   CSS
 ───────────────────────────────────────────── */
const CSS = `
  .mv-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    position: relative;
    box-shadow: 0 1px 3px rgba(15,23,42,.05);
  }

  .mv-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .mv-card-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #334155;
  }

  .mv-edit-btn {
    background: transparent;
    border: 1px solid #e2e8f0;
    padding: 6px;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mv-edit-btn:hover {
    background: #f8fafc;
    color: #1d4ed8;
    border-color: #1d4ed8;
  }

  .mv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px 40px;
  }

  .mv-info-block label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .mv-info-block span {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  /* Modal */
  .mv-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .mv-modal {
    background: #fff;
    width: 450px;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .mv-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfe;
  }

  .mv-modal-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  .mv-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mv-form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
  }

  .mv-input, .mv-select {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #1e293b;
    outline: none;
    transition: all 0.2s;
  }
  .mv-input:focus, .mv-select:focus {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
  }

  .mv-toggle-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }
  .mv-toggle-group label { margin-bottom: 0; }

  .mv-modal-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .mv-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }
  .mv-btn-cancel { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
  .mv-btn-cancel:hover { background: #f1f5f9; color: #0f172a; }
  .mv-btn-save { background: #1d4ed8; color: #fff; }
  .mv-btn-save:hover { background: #1e40af; }
  .mv-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
`;

/* ─────────────────────────────────────────────
   COMPONENT
 ───────────────────────────────────────────── */
export default function MovementRegisterSection() {
  const { data, loading } = useQuery<{
    settings: {
      movement_settings: MovementSettings;
    };
  }>(GET_SETTINGS);
  const [upsertSettings, { loading: saving }] = useMutation(UPSERT_SETTINGS, {
    refetchQueries: [{ query: GET_SETTINGS }],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<MovementSettings>({
    limit_count: 4,
    limit_frequency: "Weekly",
    max_duration_mins: 60,
    days_before_apply: 4,
    user_entry: true,
    limit_enabled: true,
  });

  const settings = data?.settings?.movement_settings || form;

  const handleEdit = () => {
    setForm(settings);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await upsertSettings({
        variables: {
          input: {
            movement_settings: {
              limit_count: parseInt(form.limit_count.toString()),
              limit_frequency: form.limit_frequency,
              max_duration_mins: parseInt(form.max_duration_mins.toString()),
              days_before_apply: parseInt(form.days_before_apply.toString()),
              user_entry: form.user_entry,
              limit_enabled: form.limit_enabled,
            },
          },
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update movement settings", err);
      alert("Failed to save settings. Please check console.");
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <>
      <style>{CSS}</style>

      <div className="mv-card">
        <div className="mv-card-header">
          <div className="mv-card-title">Movement Register Setting</div>
          <button className="mv-edit-btn" onClick={handleEdit}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        <div className="mv-grid">
          <div className="mv-info-block">
            <label>Limit Count</label>
            <span>{settings.limit_count}</span>
          </div>
          <div className="mv-info-block">
            <label>Limit Frequency</label>
            <span>{settings.limit_frequency}</span>
          </div>
          <div className="mv-info-block">
            <label>Max Duration (In mins)</label>
            <span>{settings.max_duration_mins}</span>
          </div>
          <div className="mv-info-block">
            <label>Days Before Apply</label>
            <span>{settings.days_before_apply}</span>
          </div>
          <div className="mv-info-block">
            <label>User Entry</label>
            <span>{settings.user_entry ? "Yes" : "No"}</span>
          </div>
          <div className="mv-info-block">
            <label>Limit Enabled</label>
            <span>{settings.limit_enabled ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mv-modal-overlay">
          <div className="mv-modal">
            <div className="mv-modal-header">
              <div className="mv-modal-title">
                Edit Movement Register Settings
              </div>
            </div>

            <div className="mv-modal-body">
              <div
                className="mv-grid"
                style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}
              >
                <div className="mv-form-group">
                  <label>Limit Count</label>
                  <input
                    type="number"
                    className="mv-input"
                    value={form.limit_count}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        limit_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="mv-form-group">
                  <label>Limit Frequency</label>
                  <select
                    className="mv-select"
                    value={form.limit_frequency}
                    onChange={(e) =>
                      setForm({ ...form, limit_frequency: e.target.value })
                    }
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div
                className="mv-grid"
                style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}
              >
                <div className="mv-form-group">
                  <label>Max Duration (mins)</label>
                  <input
                    type="number"
                    className="mv-input"
                    value={form.max_duration_mins}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_duration_mins: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="mv-form-group">
                  <label>Lead Time (Days)</label>
                  <input
                    type="number"
                    className="mv-input"
                    value={form.days_before_apply}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        days_before_apply: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mv-toggle-group">
                <label>User Entry Enabled</label>
                <input
                  type="checkbox"
                  checked={form.user_entry}
                  onChange={(e) =>
                    setForm({ ...form, user_entry: e.target.checked })
                  }
                />
              </div>

              <div className="mv-toggle-group">
                <label>Limit Enforcement Enabled</label>
                <input
                  type="checkbox"
                  checked={form.limit_enabled}
                  onChange={(e) =>
                    setForm({ ...form, limit_enabled: e.target.checked })
                  }
                />
              </div>
            </div>

            <div className="mv-modal-footer">
              <button
                className="mv-btn mv-btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="mv-btn mv-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
