// src/components/settings/LeaveTypesSection.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_SETTINGS, UPSERT_LEAVE_TYPE, DELETE_LEAVE_TYPE } from "../../graphql/settingsQueries";

/* ─────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────── */
interface LeaveType {
  id: string;
  name: string;
  code: string;
  total_days: number;
  max_per_request: number;
  max_consecutive_leaves: number;
  days_before_apply: number;
  max_consecutive_days: number;
  weekends_covered: boolean;
  holiday_covered: boolean;
  user_entry: boolean;
  balance_enabled: boolean;
  workload_interchange: boolean;
  document_required: boolean;
  leave_category: string;
  applicable_for: string[];
  reset_cycle: string;
  description?: string;
}

interface FormState {
  id?: string;
  name: string;
  code: string;
  total_days: string;
  max_per_request: string;
  max_consecutive_leaves: string;
  days_before_apply: string;
  max_consecutive_days: string;
  weekends_covered: boolean;
  holiday_covered: boolean;
  user_entry: boolean;
  balance_enabled: boolean;
  workload_interchange: boolean;
  document_required: boolean;
  leave_category: string;
  applicable_for: string[];
  reset_cycle: string;
}

interface FormErrors {
  name?: string;
  code?: string;
  total_days?: string;
}

const EMPTY_FORM: FormState = { 
  name: "", 
  code: "", 
  total_days: "0", 
  max_per_request: "0",
  max_consecutive_leaves: "0",
  days_before_apply: "0",
  max_consecutive_days: "0",
  weekends_covered: false,
  holiday_covered: false,
  user_entry: true,
  balance_enabled: true,
  workload_interchange: false,
  document_required: false,
  leave_category: "paid",
  applicable_for: ["Male", "Female", "Other"],
  reset_cycle: "yearly"
};

/* ─────────────────────────────────────────────
   CSS
 ───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
  
  .ds-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    width: 100%;
  }

  .ds-card-header {
    padding: 24px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ds-card-body {
    padding: 0;
  }

  .ds-empty {
    padding: 48px 24px;
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
  .ds-empty p    { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 3px; }
  .ds-empty span { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: #94a3b8; }

  .ds-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
  .ds-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .ds-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }

  .ds-input {
    height: 38px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: all 0.2s;
  }
  .ds-input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,0.08); }
  .ds-input.error { border-color: #ef4444; }

  .ds-select {
    height: 38px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  /* Switches */
  .ds-switch-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 40px;
    margin-top: 10px;
  }
  .ds-switch-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ds-switch-label { font-size: 13px; font-weight: 500; color: #334155; }
  .ds-switch {
    width: 36px;
    height: 20px;
    background: #e2e8f0;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
  }
  .ds-switch.active { background: #3b82f6; }
  .ds-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .ds-switch.active::after { transform: translateX(16px); }

  /* Modal */
  .ds-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15,23,42,0.5);
    backdrop-filter: blur(2px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .ds-modal {
    background: #fff;
    width: 100%;
    max-width: 640px;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    overflow: hidden;
    animation: dsModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ds-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ds-modal-title { font-size: 16px; font-weight: 600; color: #0f172a; }
  .ds-modal-body   { padding: 24px; max-height: 80vh; overflow-y: auto; }
  .ds-modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }

  .ds-btn {
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .ds-btn-primary { background: #1d4ed8; color: #fff; border: none; }
  .ds-btn-primary:hover { background: #1e40af; }
  .ds-btn-secondary { background: #fff; color: #475569; border: 1px solid #e2e8f0; }
  .ds-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

  .ds-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 1100;
    background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 12px;
    font-size: 13px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    display: flex; align-items: center; gap: 10px; animation: dsToastIn 0.3s ease both;
  }

  .ds-table-wrap { overflow-x: auto; }
  table.ds-table { width: 100%; border-collapse: collapse; }
  .ds-table thead tr { background: #f8fafc; border-bottom: 1px solid #e8edf5; }
  .ds-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; }
  .ds-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .ds-table tbody tr:hover { background: #fafbfe; }
  .ds-table td { padding: 14px 16px; vertical-align: middle; font-size: 13px; color: #334155; }

  .ds-code-pill {
    display: inline-block; padding: 2px 8px; border-radius: 6px;
    background: #eff6ff; color: #1d4ed8; font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 600;
  }

  .ds-action-btn {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
    background: #fff; display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; color: #475569; transition: all 0.2s;
  }
  .ds-action-btn:hover { background: #f1f5f9; color: #1d4ed8; border-color: #cbd5e1; }
  .ds-action-btn.del:hover { background: #fff1f2; color: #e11d48; border-color: #fecaca; }
  .ds-action-btn svg { display: block; }

  @media (prefers-color-scheme: dark) {
    .ds-card { background: #1e293b; border-color: #334155; }
    .ds-card-header { border-bottom-color: #334155; }
    .ds-table thead tr { background: #0f172a; border-bottom-color: #334155; }
    .ds-table tbody tr { border-bottom-color: #334155; }
    .ds-table tbody tr:hover { background: #0f172a; }
    .ds-table td { color: #f1f5f9; }
    .ds-table th { color: #94a3b8; }
    .ds-modal { background: #1e293b; color: #f1f5f9; }
    .ds-modal-header { border-bottom-color: #334155; }
    .ds-modal-footer { background: #0f172a; border-top-color: #334155; }
    .ds-input, .ds-select { background: #0f172a; border-color: #334155; color: #f1f5f9; }
    .ds-modal-title { color: #f1f5f9; }
  }

  @keyframes dsModalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes dsToastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ─────────────────────────────────────────────
   ICON COMPONENTS (Static)
 ───────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const EditIcon = ({ color = "currentColor" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = ({ color = "currentColor" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function LeaveTypesSection() {
  const { data, loading, refetch } = useQuery<{ settings: { leave_types: LeaveType[] } }>(GET_SETTINGS, {
    fetchPolicy: 'network-only'
  });
  const [upsertLeaveType, { loading: saveLoading }] = useMutation(UPSERT_LEAVE_TYPE, {
    onCompleted: () => {
      refetch();
      showToast(form.id ? "Leave type updated." : "New leave type added.");
      closeModal();
    },
  });
  const [deleteLeaveType] = useMutation(DELETE_LEAVE_TYPE, {
    onCompleted: () => {
      refetch();
      showToast("Leave type removed.");
    },
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const leaveTypes: LeaveType[] = data?.settings?.leave_types || [];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function openEdit(lt: LeaveType) {
    setForm({
      id: lt.id,
      name: lt.name,
      code: lt.code,
      total_days: String(lt.total_days),
      max_per_request: String(lt.max_per_request),
      max_consecutive_leaves: String(lt.max_consecutive_leaves || 0),
      days_before_apply: String(lt.days_before_apply || 0),
      max_consecutive_days: String(lt.max_consecutive_days || 0),
      weekends_covered: lt.weekends_covered || false,
      holiday_covered: lt.holiday_covered || false,
      user_entry: lt.user_entry !== false,
      balance_enabled: lt.balance_enabled !== false,
      workload_interchange: lt.workload_interchange || false,
      document_required: lt.document_required || false,
      leave_category: lt.leave_category,
      applicable_for: lt.applicable_for,
      reset_cycle: lt.reset_cycle
    });
    setShowModal(true);
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.code.trim()) errs.code = "Required";
    if (isNaN(Number(form.total_days))) errs.total_days = "Number required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      await upsertLeaveType({
        variables: {
          input: {
            id: form.id,
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            total_days: parseInt(form.total_days),
            max_per_request: parseInt(form.max_per_request || "0"),
            max_consecutive_leaves: parseInt(form.max_consecutive_leaves || "0"),
            days_before_apply: parseInt(form.days_before_apply || "0"),
            max_consecutive_days: parseInt(form.max_consecutive_days || "0"),
            weekends_covered: form.weekends_covered,
            holiday_covered: form.holiday_covered,
            user_entry: form.user_entry,
            balance_enabled: form.balance_enabled,
            workload_interchange: form.workload_interchange,
            document_required: form.document_required,
            leave_category: form.leave_category,
            applicable_for: form.applicable_for,
            reset_cycle: form.reset_cycle
          }
        }
      });
    } catch (e) {
       showToast(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this leave type?")) return;
    try {
      await deleteLeaveType({ variables: { id } });
    } catch (e) {
       showToast(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <style>{CSS}</style>
      
      <div className="ds-card">
        <div className="ds-card-header">
          <div>
            <h2 style={{ fontSize:18, fontWeight:600, color:"var(--text-primary, #0f172a)", margin:0 }}>Leave Types</h2>
            <p style={{ fontSize:13, color:"var(--text-muted, #64748b)", marginTop:4 }}>Configure leave rules and categories.</p>
          </div>
          <button className="ds-btn ds-btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
            <PlusIcon /> Add Leave Type
          </button>
        </div>

        <div className="ds-card-body">
          {loading ? (
            <div className="ds-empty"><p>Loading leave types...</p></div>
          ) : leaveTypes.length === 0 ? (
            <div className="ds-empty">
              <div className="ds-empty-icon"><CalendarIcon /></div>
              <p>No leave types yet</p>
              <span>Click the button above to add your first leave type.</span>
            </div>
          ) : (
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Leave Name</th>
                    <th>Category</th>
                    <th>Quota (Days)</th>
                    <th>Max Consecutive</th>
                    <th style={{ textAlign:"right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveTypes.map((lt) => (
                    <tr key={lt.id}>
                      <td><span className="ds-code-pill">{lt.code}</span></td>
                      <td><span style={{ fontWeight: 600 }}>{lt.name}</span></td>
                      <td><span style={{ textTransform:"capitalize", color:"#64748b" }}>{lt.leave_category}</span></td>
                      <td><span style={{ fontWeight: 600, color: "#475569" }}>{lt.total_days}</span></td>
                      <td><span>{lt.max_consecutive_leaves || 0}</span></td>
                      <td>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                          <button className="ds-action-btn" onClick={() => openEdit(lt)} title="Edit">
                            <EditIcon />
                          </button>
                          <button className="ds-action-btn del" onClick={() => handleDelete(lt.id)} title="Delete">
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="ds-modal-overlay" onClick={closeModal}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <span className="ds-modal-title">{form.id ? "Edit Leave Type" : "Add Leave Type"}</span>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8" }} onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="ds-modal-body">
              <div className="ds-field-row">
                <div className="ds-field">
                  <label className="ds-label">Leave Code</label>
                  <input 
                    className={`ds-input${errors.code ? " error" : ""}`}
                    value={form.code}
                    placeholder="e.g. CL"
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Leave Name</label>
                  <input 
                    className={`ds-input${errors.name ? " error" : ""}`}
                    value={form.name}
                    placeholder="e.g. Casual Leave"
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ds-field-row">
                <div className="ds-field">
                  <label className="ds-label">Select Category</label>
                  <select className="ds-select" value={form.leave_category} onChange={e => setForm(p => ({ ...p, leave_category: e.target.value }))}>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div className="ds-field">
                  <label className="ds-label">Max Consecutive Leaves</label>
                  <input 
                    type="number"
                    className="ds-input"
                    value={form.max_consecutive_leaves}
                    onChange={e => setForm(p => ({ ...p, max_consecutive_leaves: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ds-field-row">
                <div className="ds-field">
                  <label className="ds-label">Days Before Apply</label>
                  <input 
                    type="number"
                    className="ds-input"
                    value={form.days_before_apply}
                    onChange={e => setForm(p => ({ ...p, days_before_apply: e.target.value }))}
                  />
                </div>
                <div className="ds-field">
                  <label className="ds-label">Max Consecutive Days</label>
                  <input 
                    type="number"
                    className="ds-input"
                    value={form.max_consecutive_days}
                    onChange={e => setForm(p => ({ ...p, max_consecutive_days: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ds-divider" style={{ margin: "10px 0 20px 0" }} />

              <div className="ds-field-row">
                <div className="ds-field">
                  <label className="ds-label">Reset Cycle</label>
                  <select className="ds-select" value={form.reset_cycle} onChange={e => setForm(p => ({ ...p, reset_cycle: e.target.value }))}>
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="ds-field">
                  <label className="ds-label">Applicable For (Gender)</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    {["Male", "Female", "Other"].map(g => (
                      <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={form.applicable_for.includes(g)}
                          onChange={e => {
                            const next = e.target.checked 
                              ? [...form.applicable_for, g]
                              : form.applicable_for.filter(x => x !== g);
                            setForm(p => ({ ...p, applicable_for: next }));
                          }}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ds-divider" style={{ margin: "10px 0 20px 0" }} />

              <div className="ds-switch-grid">
                <Switch 
                  label="Weekends Covered" 
                  active={form.weekends_covered} 
                  onChange={v => setForm(p => ({ ...p, weekends_covered: v }))} 
                />
                <Switch 
                  label="Holiday Covered" 
                  active={form.holiday_covered} 
                  onChange={v => setForm(p => ({ ...p, holiday_covered: v }))} 
                />
                <Switch 
                  label="User Entry" 
                  active={form.user_entry} 
                  onChange={v => setForm(p => ({ ...p, user_entry: v }))} 
                />
                <Switch 
                  label="Leave Balance Enabled" 
                  active={form.balance_enabled} 
                  onChange={v => setForm(p => ({ ...p, balance_enabled: v }))} 
                />
                <Switch 
                  label="Workload Interchange" 
                  active={form.workload_interchange} 
                  onChange={v => setForm(p => ({ ...p, workload_interchange: v }))} 
                />
                <Switch 
                  label="Document Required" 
                  active={form.document_required} 
                  onChange={v => setForm(p => ({ ...p, document_required: v }))} 
                />
              </div>

              <div className="ds-field" style={{ marginTop: 24 }}>
                <label className="ds-label">Total Days (Yearly Quota)</label>
                <input 
                  type="number"
                  className={`ds-input${errors.total_days ? " error" : ""}`}
                  value={form.total_days}
                  onChange={e => setForm(p => ({ ...p, total_days: e.target.value }))}
                />
              </div>
            </div>

            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={closeModal} disabled={saveLoading}>Cancel</button>
              <button className="ds-btn ds-btn-primary" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ds-toast"><CheckIcon />{toast}</div>}
    </>
  );
}

function Switch({ label, active, onChange }: { label: string, active: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="ds-switch-field">
      <span className="ds-switch-label">{label}</span>
      <div className={`ds-switch${active ? " active" : ""}`} onClick={() => onChange(!active)} />
    </div>
  );
}
