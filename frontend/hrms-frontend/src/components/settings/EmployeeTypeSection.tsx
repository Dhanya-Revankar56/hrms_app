// src/components/settings/EmployeeTypeSection.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_SETTINGS, UPSERT_EMPLOYEE_TYPE, DELETE_EMPLOYEE_TYPE } from "../../graphql/settingsQueries";
import SettingsSection from "./SettingsSection";

const CSS = `
  .ts-add-form { display: flex; gap: 10px; margin-bottom: 20px; align-items: flex-end; }
  .ts-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .ts-label { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #334155; }
  .ts-input { height: 36px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; }
  .ts-input:focus { border-color: #1d4ed8; background: #fff; box-shadow: 0 0 0 3px rgba(29,78,216,.09); }
  .ts-add-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: #1d4ed8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .ts-table { width: 100%; border-collapse: collapse; }
  .ts-table th { text-align: left; padding: 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
  .ts-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .ts-del-btn { color: #dc2626; background: none; border: none; cursor: pointer; }
`;

export default function EmployeeTypeSection() {
  const { data, refetch } = useQuery<{ settings: { employee_types: Array<{ id: string; name: string }> } }>(GET_SETTINGS, {
    fetchPolicy: 'network-only'
  });
  const [upsertEmployeeType] = useMutation(UPSERT_EMPLOYEE_TYPE, { onCompleted: () => refetch() });
  const [deleteEmployeeType] = useMutation(DELETE_EMPLOYEE_TYPE, { onCompleted: () => refetch() });
  const [name, setName] = useState("");

  const types = data?.settings?.employee_types || [];

  const handleAdd = async () => {
    if (!name.trim()) return;
    await upsertEmployeeType({ variables: { input: { name: name.trim() } } });
    setName("");
  };

  return (
    <>
      <style>{CSS}</style>
      <SettingsSection title={`Employee Types (${types.length})`} description="Manage employment types (e.g. Regular, Contract, Intern)." icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}>
        <div className="ts-add-form">
          <div className="ts-field">
            <label className="ts-label">Type Name</label>
            <input className="ts-input" placeholder="e.g. Full-time" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="ts-add-btn" onClick={handleAdd}>Add Type</button>
        </div>
        <table className="ts-table">
          <thead><tr><th>Name</th><th>Action</th></tr></thead>
          <tbody>
            {types.map((t: { id: string; name: string }) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td><button className="ts-del-btn" onClick={() => deleteEmployeeType({ variables: { id: t.id } })}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsSection>
    </>
  );
}
