// src/components/settings/UserManagementSection.tsx

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_EMPLOYEES, UPDATE_EMPLOYEE } from "../../graphql/employeeQueries";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type ManageRole = "Admin" | "Hod" | "Member" | "Employee";

interface ManagedUser {
  id: string;
  name: string;
  role: ManageRole;
  status: string;
  email: string;
  department: string;
}

/* ─────────────────────────────────────────────
   HELPERS & MAPPERS
───────────────────────────────────────────── */
function mapBackendRoleToUI(app_role: string): ManageRole {
  if (app_role === "Admin") return "Admin";
  if (app_role === "DeptAdmin") return "Hod";
  if (app_role === "Member") return "Member";
  return "Employee";
}

function mapUIToBackendRole(ui_role: ManageRole): string {
  if (ui_role === "Admin") return "Admin";
  if (ui_role === "Hod") return "DeptAdmin";
  if (ui_role === "Member") return "Member";
  return "employee";
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap');

  .um-section { font-family: 'DM Sans', sans-serif; }

  /* ── Header & Tabs ── */
  .um-header { margin-bottom: 24px; padding-bottom: 12px; }
  .um-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
  .um-tabs { display: flex; gap: 24px; border-bottom: 1px solid #e2e8f0; }
  .um-tab { 
    padding: 0 4px 12px; font-size: 14px; font-weight: 500; color: #64748b; 
    cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; 
  }
  .um-tab:hover { color: #0f172a; }
  .um-tab.active { color: #1d4ed8; border-bottom-color: #1d4ed8; font-weight: 600; }

  /* ── Toolbar ── */
  .um-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
  .um-toolbar-left { display: flex; gap: 12px; align-items: center; }
  
  .um-search-wrap { position: relative; width: 260px; }
  .um-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 16px; height: 16px; }
  .um-search-input { 
    width: 100%; height: 38px; padding: 0 12px 0 36px; border: 1.5px solid #e2e8f0; 
    border-radius: 8px; background: #fff; font-size: 13.5px; outline: none; transition: 0.2s; 
    color: #0f172a; box-sizing: border-box; font-family: inherit;
  }
  .um-search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  .um-btn-assign {
    height: 38px; padding: 0 16px; border: 1px solid #10b981; border-radius: 6px; 
    background: #fff; font-size: 12.5px; font-weight: 700; color: #10b981; 
    cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s;
    letter-spacing: 0.05em; text-transform: uppercase; font-family: inherit;
  }
  .um-btn-assign:hover { background: #f0fdf4; }

  /* ── Tables & Grouping ── */
  .um-dept-group { margin-bottom: 32px; }
  .um-dept-title { font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .um-dept-badge { background: #e2e8f0; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }

  .um-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.05); overflow: hidden; }
  .um-table-wrap { overflow-x: auto; }
  .um-table { width: 100%; border-collapse: collapse; text-align: left; }
  .um-table th { 
    padding: 16px 24px; font-size: 12.5px; font-weight: 700; color: #0f172a; 
    border-bottom: 1px solid #f1f5f9; background: #fafbfe; white-space: nowrap; 
  }
  .um-table td { 
    padding: 16px 24px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; 
    transition: background 0.15s; 
  }
  .um-table tbody tr:hover td { background: #fafbfe; }
  .um-table tbody tr:last-child td { border-bottom: none; }

  .um-status-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 16px; border-radius: 6px; font-size: 12.5px; font-weight: 600;
    font-family: 'Inter', sans-serif;
  }
  .um-status-active { background: #52b788; color: #fff; }
  .um-status-inactive { background: #cbd5e1; color: #fff; }

  /* ── Modal ── */
  .um-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .um-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 460px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); overflow: hidden; }
  .um-modal-head { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .um-modal-title { font-size: 18px; font-weight: 700; color: #0f172a; }
  .um-modal-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
  .um-modal-close:hover { background: #f1f5f9; color: #0f172a; }
  .um-modal-body { padding: 24px; }
  .um-field { margin-bottom: 20px; }
  .um-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
  .um-select { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 14px; font-family: inherit; color: #0f172a; outline: none; transition: 0.2s; }
  .um-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .um-modal-actions { padding: 16px 24px; border-top: 1px solid #f1f5f9; background: #fafbfe; display: flex; justify-content: flex-end; gap: 12px; }
  .um-btn { height: 38px; padding: 0 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; transition: 0.2s; border: none; display: inline-flex; align-items: center; justify-content: center; }
  .um-btn-cancel { background: #fff; border: 1px solid #e2e8f0; color: #475569; }
  .um-btn-cancel:hover { background: #f8fafc; color: #0f172a; }
  .um-btn-save { background: #1d4ed8; color: #fff; }
  .um-btn-save:hover { background: #1e40af; }
  .um-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Dark Mode Overrides ── */
  html[data-theme="dark"] .um-title,
  html[data-theme="dark"] .um-tab:hover,
  html[data-theme="dark"] .um-dept-title,
  html[data-theme="dark"] .um-table th,
  html[data-theme="dark"] .um-table td,
  html[data-theme="dark"] .um-modal-title,
  html[data-theme="dark"] .um-label { color: var(--text-primary); }
  
  html[data-theme="dark"] .um-card,
  html[data-theme="dark"] .um-search-input,
  html[data-theme="dark"] .um-modal,
  html[data-theme="dark"] .um-select,
  html[data-theme="dark"] .um-btn-cancel,
  html[data-theme="dark"] .um-btn-assign { 
    background: var(--white); border-color: var(--border); color: var(--text-primary); 
  }

  html[data-theme="dark"] .um-dept-badge { background: #334155; color: var(--text-muted); }
  html[data-theme="dark"] .um-table th { background: transparent; border-bottom-color: var(--border); color: var(--text-muted); }
  html[data-theme="dark"] .um-table td, html[data-theme="dark"] .um-tabs, html[data-theme="dark"] .um-modal-head, html[data-theme="dark"] .um-modal-actions { border-color: var(--border); }
  html[data-theme="dark"] .um-modal-actions { background: rgba(0,0,0,0.2); }
  html[data-theme="dark"] .um-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
  html[data-theme="dark"] .um-tab { color: var(--text-muted); }
  html[data-theme="dark"] .um-tab.active { color: var(--accent-light); border-bottom-color: var(--accent-light); }
  html[data-theme="dark"] .um-status-inactive { background: #334155; }
`;

export default function UserManagementSection() {
  const { data: employeesData, refetch } = useQuery<{
    getAllEmployees: {
      items: Array<{
        id: string;
        first_name: string;
        last_name: string;
        user_email: string;
        app_role?: string;
        app_status?: string;
        work_detail?: {
          department?: { name: string };
        };
      }>;
    };
  }>(GET_EMPLOYEES, { fetchPolicy: 'network-only' });
  const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);
  
  const [activeTab, setActiveTab] = useState<"Users" | "Admin">("Users");
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ManageRole>("Hod");
  const [isSaving, setIsSaving] = useState(false);

  const users: ManagedUser[] = useMemo(() => {
    if (!employeesData?.getAllEmployees?.items) return [];
    return employeesData.getAllEmployees.items.map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
      role: mapBackendRoleToUI(e.app_role || "employee"),
      status: e.app_status === "active" ? "Active" : "Inactive",
      email: e.user_email,
      department: e.work_detail?.department?.name || "No Department assigned"
    }));
  }, [employeesData]);

  // Group explicitly assigned users (Hod & Member) by department for the "Users" tab
  const groupedUsers = useMemo(() => {
    // Only show explicitly assigned 'Hod' and 'Member' users
    let deptUsersList = users.filter(u => u.role === "Hod" || u.role === "Member");
    const term = search.toLowerCase();
    if (term) {
      deptUsersList = deptUsersList.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }
    
    const groups: Record<string, ManagedUser[]> = {};
    deptUsersList.forEach(u => {
      if (!groups[u.department]) groups[u.department] = [];
      groups[u.department].push(u);
    });
    return groups;
  }, [users, search]);

  // Filter Admins for the "Admin" tab
  const filteredAdmins = useMemo(() => {
    let adms = users.filter(u => u.role === "Admin");
    const term = search.toLowerCase();
    if (term) {
      adms = adms.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }
    return adms;
  }, [users, search]);

  const handleAssignSubmit = async () => {
    if (!selectedEmpId || !selectedRole) return;
    setIsSaving(true);
    try {
      await updateEmployee({
        variables: {
          id: selectedEmpId,
          input: { app_role: mapUIToBackendRole(selectedRole) }
        }
      });
      setIsModalOpen(false);
      setSelectedEmpId("");
      refetch();
    } catch (e) {
      console.error(e);
      alert("Failed to assign user.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTable = (userList: ManagedUser[]) => (
    <div className="um-card">
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Name</th>
              <th style={{ width: '35%' }}>System Role</th>
              <th style={{ width: '20%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {userList.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td style={{ color: '#64748b', fontWeight: 500 }}>
                  {u.role === 'Hod' ? 'Head of Department' : u.role}
                </td>
                <td>
                  <span className={`um-status-badge ${u.status === 'Active' ? 'um-status-active' : 'um-status-inactive'}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="um-section">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="um-header">
        <h2 className="um-title">User Management</h2>
        <div className="um-tabs">
          <div className={`um-tab ${activeTab === "Users" ? "active" : ""}`} onClick={() => setActiveTab("Users")}>Users</div>
          <div className={`um-tab ${activeTab === "Admin" ? "active" : ""}`} onClick={() => setActiveTab("Admin")}>Admins</div>
        </div>
      </div>

      <div className="um-toolbar">
        <div className="um-toolbar-left">
          <div className="um-search-wrap">
            <svg className="um-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="um-search-input" placeholder="Search User or Email" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <button className="um-btn-assign" onClick={() => setIsModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>
          Assign User
        </button>
      </div>

      {activeTab === "Users" && (
        <>
          {Object.keys(groupedUsers).length > 0 ? (
            Object.entries(groupedUsers).map(([dept, deptUsers]) => (
              <div key={dept} className="um-dept-group">
                <div className="um-dept-title">
                  {dept} <span className="um-dept-badge">{deptUsers.length}</span>
                </div>
                {renderTable(deptUsers)}
              </div>
            ))
          ) : (
             <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              No assigned users found matching your search. Use "Assign User" to add them.
            </div>
          )}
        </>
      )}

      {activeTab === "Admin" && (
        <>
          {filteredAdmins.length > 0 ? (
            <div className="um-dept-group">
              <div className="um-dept-title">
                System Administrators <span className="um-dept-badge">{filteredAdmins.length}</span>
              </div>
              {renderTable(filteredAdmins)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              No Admins found matching your search.
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="um-overlay">
          <div className="um-modal">
            <div className="um-modal-head">
              <div className="um-modal-title">Assign System Role</div>
              <button className="um-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-field">
                <label className="um-label">1. Select Employee</label>
                <select className="um-select" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                  <option value="">-- Choose Employee --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role === 'Employee' ? 'Unassigned' : u.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="um-field">
                <label className="um-label">2. Assign Role</label>
                <select className="um-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value as ManageRole)}>
                  <option value="Hod">Department Head (Hod)</option>
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="um-modal-actions">
              <button className="um-btn um-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="um-btn um-btn-save" onClick={handleAssignSubmit} disabled={isSaving || !selectedEmpId}>
                {isSaving ? "Saving..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
