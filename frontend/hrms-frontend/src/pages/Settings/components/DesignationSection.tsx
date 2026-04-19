// src/components/settings/DesignationsSection.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_SETTINGS,
  UPSERT_DESIGNATION,
  DELETE_DESIGNATION,
} from "../../../graphql/settingsQueries";
import SettingsSection from "./SettingsSection";

/* ─────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────── */
interface Designation {
  id: string;
  name: string;
  short_name: string;
}

interface FormState {
  name: string;
  code: string;
}

interface FormErrors {
  name?: string;
  code?: string;
}

const EMPTY_FORM: FormState = { name: "", code: "" };

/* ─────────────────────────────────────────────
   CSS
 ───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

  .dsg-empty {
    padding: 36px 20px;
    text-align: center;
    color: #94a3b8;
  }
  .dsg-empty-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    color: #94a3b8;
  }
  .dsg-empty p    { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 3px; }
  .dsg-empty span { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: #94a3b8; }

  .ds-add-form {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .ds-field { display: flex; flex-direction: column; gap: 5px; }
  .ds-field-name  { flex: 1 1 200px; }
  .ds-field-code  { flex: 0 0 110px; }

  .ds-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #334155;
  }

  .ds-input {
    height: 36px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #0f172a;
    background: #f8fafc;
    outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .ds-input::placeholder { color: #94a3b8; }
  .ds-input:focus {
    border-color: #1d4ed8;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(29,78,216,.09);
  }
  .ds-input.error { border-color: #dc2626; }

  .ds-add-btn {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    border: none;
    background: #1d4ed8;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.13s;
    white-space: nowrap;
    flex-shrink: 0;
    align-self: flex-end;
  }
  .ds-add-btn:hover { background: #1e40af; }
  .ds-add-btn:disabled { background: #93c5fd; cursor: not-allowed; }

  .ds-error-msg {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #dc2626;
    margin-top: 3px;
  }

  .ds-divider {
    height: 1px;
    background: #f1f5f9;
    margin-bottom: 16px;
  }

  .ds-table-wrap { overflow-x: auto; }

  table.ds-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ds-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e8edf5;
  }

  .ds-table th {
    padding: 9px 14px;
    text-align: left;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    white-space: nowrap;
  }

  .ds-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.1s;
  }
  .ds-table tbody tr:last-child { border-bottom: none; }
  .ds-table tbody tr:hover { background: #fafbfe; }

  .ds-table td {
    padding: 12px 14px;
    vertical-align: middle;
  }

  .dsg-name-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }

  .dsg-code-pill {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 6px;
    background: #eff6ff;
    color: #1d4ed8;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums;
  }

  .ds-del-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #fecaca;
    background: #fff5f5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #dc2626;
    transition: all 0.13s;
    padding: 0;
  }
  .ds-del-btn:hover { background: #fee2e2; border-color: #fca5a5; }

  .ds-empty {
    padding: 36px 20px;
    text-align: center;
    color: #94a3b8;
  }
  .ds-empty-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    color: #94a3b8;
  }
  .ds-empty p { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 3px; }
  .ds-empty span { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: #94a3b8; }

  .ds-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999;
    background: #0f172a;
    color: #fff;
    padding: 10px 16px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    box-shadow: 0 8px 24px rgba(15,23,42,.2);
    display: flex;
    align-items: center;
    gap: 8px;
    animation: dsToastIn 0.22s ease both;
  }
  @keyframes dsToastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function DesignationsSection() {
  const { data, loading, refetch } = useQuery<{
    settings: { designations: Designation[] };
  }>(GET_SETTINGS, {
    fetchPolicy: "network-only",
  });
  const designations: Designation[] = data?.settings?.designations || [];
  const [upsertDesignation, { loading: addLoading }] = useMutation(
    UPSERT_DESIGNATION,
    {
      onCompleted: () => {
        refetch();
        showToast(`"${form.name}" added.`);
        setForm(EMPTY_FORM);
      },
    },
  );
  const [deleteDesignation] = useMutation(DELETE_DESIGNATION, {
    onCompleted: () => {
      refetch();
      showToast("Designation removed.");
    },
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.code.trim()) errs.code = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      await upsertDesignation({
        variables: {
          input: {
            name: form.name.trim(),
            short_name: form.code.trim().toUpperCase(),
          },
        },
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this designation?")) return;
    try {
      await deleteDesignation({ variables: { id } });
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  }

  const PlusIcon = (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
  const TrashIcon = (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
  const CheckIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ade80"
      strokeWidth="2.5"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  const BadgeIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  return (
    <>
      <style>{CSS}</style>
      <SettingsSection
        title={`Designations (${designations.length})`}
        description="Manage job titles used in the organisation."
        icon={BadgeIcon}
      >
        <div className="ds-add-form">
          <div className="ds-field ds-field-name">
            <label className="ds-label">Designation Name</label>
            <input
              className={`ds-input${errors.name ? " error" : ""}`}
              placeholder="e.g. Professor"
              value={form.name}
              disabled={addLoading}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: undefined }));
              }}
            />
            {errors.name && <span className="ds-error-msg">{errors.name}</span>}
          </div>

          <div className="ds-field ds-field-code">
            <label className="ds-label">Short Code</label>
            <input
              className={`ds-input${errors.code ? " error" : ""}`}
              placeholder="e.g. PROF"
              value={form.code}
              disabled={addLoading}
              onChange={(e) => {
                setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }));
                setErrors((p) => ({ ...p, code: undefined }));
              }}
            />
            {errors.code && <span className="ds-error-msg">{errors.code}</span>}
          </div>

          <button
            className="ds-add-btn"
            onClick={handleSave}
            disabled={addLoading}
          >
            {PlusIcon} {addLoading ? "Adding..." : "Add Designation"}
          </button>
        </div>

        <div className="ds-divider" />

        {loading ? (
          <div className="ds-empty">
            <p>Loading designations...</p>
          </div>
        ) : designations.length === 0 ? (
          <div className="ds-empty">
            <div className="ds-empty-icon">{BadgeIcon}</div>
            <p>No designations yet</p>
            <span>Add your first designation using the form above.</span>
          </div>
        ) : (
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Designation Name</th>
                  <th>Code</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="dsg-name-text">{d.name}</span>
                    </td>
                    <td>
                      <span className="dsg-code-pill">{d.short_name}</span>
                    </td>
                    <td>
                      <button
                        className="ds-del-btn"
                        onClick={() => handleDelete(d.id)}
                      >
                        {TrashIcon}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSection>

      {toast && (
        <div className="ds-toast">
          {CheckIcon}
          {toast}
        </div>
      )}
    </>
  );
}
