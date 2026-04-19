// src/components/settings/CategorySection.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_SETTINGS,
  UPSERT_CATEGORY,
  DELETE_CATEGORY,
} from "../../../graphql/settingsQueries";
import SettingsSection from "./SettingsSection";

const CSS = `
  .cs-add-form { display: flex; gap: 10px; margin-bottom: 20px; align-items: flex-end; }
  .cs-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
  .cs-label { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #334155; }
  .cs-input { height: 36px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; }
  .cs-input:focus { border-color: #1d4ed8; background: #fff; box-shadow: 0 0 0 3px rgba(29,78,216,.09); }
  .cs-add-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: #1d4ed8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .cs-table { width: 100%; border-collapse: collapse; }
  .cs-table th { text-align: left; padding: 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
  .cs-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .cs-del-btn { color: #dc2626; background: none; border: none; cursor: pointer; }
`;

export default function CategorySection() {
  const { data, refetch } = useQuery<{
    settings: { employee_categories: Array<{ id: string; name: string }> };
  }>(GET_SETTINGS, {
    fetchPolicy: "network-only",
  });
  const [upsertCategory] = useMutation(UPSERT_CATEGORY, {
    onCompleted: () => refetch(),
  });
  const [deleteCategory] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => refetch(),
  });
  const [name, setName] = useState("");

  const categories = data?.settings?.employee_categories || [];

  const handleAdd = async () => {
    if (!name.trim()) return;
    await upsertCategory({ variables: { input: { name: name.trim() } } });
    setName("");
  };

  return (
    <>
      <style>{CSS}</style>
      <SettingsSection
        title={`Employee Categories (${categories.length})`}
        description="Manage employee categories (e.g. Teaching, Non-Teaching)."
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h10" />
          </svg>
        }
      >
        <div className="cs-add-form">
          <div className="cs-field">
            <label className="cs-label">Category Name</label>
            <input
              className="cs-input"
              placeholder="e.g. Staff"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button className="cs-add-btn" onClick={handleAdd}>
            Add Category
          </button>
        </div>
        <table className="cs-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: { id: string; name: string }) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>
                  <button
                    className="cs-del-btn"
                    onClick={() => deleteCategory({ variables: { id: c.id } })}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsSection>
    </>
  );
}
