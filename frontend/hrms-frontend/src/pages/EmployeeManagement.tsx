// src/pages/EmployeeManagement.tsx

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_EMPLOYEES, UPDATE_EMPLOYEE } from "../graphql/employeeQueries";
import { GET_SETTINGS } from "../graphql/settingsQueries";
import { formatDateForDisplay } from "../utils/dateUtils";

/* ─────────────────────────────────────────────
   TYPES
 ───────────────────────────────────────────── */
type EmpStatus = "Active" | "On Leave" | "Resigned" | "Terminated";
type EmpRole   = "HR Admin" | "Department Admin" | "Employee";
type DocStatus = "Approved" | "Pending" | "Rejected";


interface EmpDocument {
  name: string;
  status: DocStatus;
}

interface BankDetail {
  bank_name: string;
  account_no: string;
  ifsc: string;
  bank_type: string;
}

interface ManagedEmployee {
  id: string;
  empId: string;
  title: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  personalEmail: string;
  phone: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  hrDepartment: string; // This will store the name for display in table
  hrDepartmentId: string;
  academicsDepartment: string;
  designation: string; // This will store the name for display in table
  designationId: string;
  employmentType: string;
  employmentSubType: string;
  category: string;
  hiringSource: string;
  experienceYears: string;
  experienceMonths: string;
  previousQualification: string;
  joiningDate: string;
  reportingManager: string;
  workLocation: string;
  fatherName: string;
  aadhaar: string;
  pan: string;
  passport: string;
  pfNumber: string;
  esicNumber: string;
  maritalStatus: string;
  religion: string;
  caste: string;
  personalCategory: string;
  secondaryEmail: string;
  secondaryContact: string;
  scholarLink: string;
  linkedinLink: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  status: EmpStatus;
  role: EmpRole;
  documents: EmpDocument[];
  salaryGrade: string;
  avatarColor: string;
  bankDetails: BankDetail[];
}

interface FilterState {
  search: string;
  status: EmpStatus | "All";
  department: string;
  employmentType: string | "All";
  role: EmpRole | "All";
}

/* ─────────────────────────────────────────────
   CONSTANTS
 ───────────────────────────────────────────── */
const AVATAR_COLORS: string[] = [
  "#1d4ed8", "#059669", "#7c3aed", "#d97706",
  "#0891b2", "#dc2626", "#db2777", "#0f766e",
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap');
  .em-container { padding: 24px; font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }
  .em-header { margin-bottom: 24px; }
  .em-title { font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
  .em-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
  .em-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .em-stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .em-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .em-stat-val { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #1e293b; }
  .em-stat-lbl { font-size: 13px; color: #64748b; font-weight: 500; }
  
  .em-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .em-filter-bar { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .em-search { flex: 1; min-width: 200px; height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; outline: none; }
  .em-select { height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; outline: none; cursor: pointer; }
  
  .em-table-wrap { overflow-x: auto; }
  .em-table { width: 100%; border-collapse: collapse; }
  .em-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; background: #fafbfe; cursor: pointer; }
  .em-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
  .em-emp-cell { display: flex; align-items: center; gap: 12px; }
  .em-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px; }
  
  .em-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
  .em-status-active { background: #f0fdf4; color: #15803d; }
  .em-status-leave { background: #fffbeb; color: #b45309; }
  
  .em-actions { display: flex; gap: 8px; }
  .em-act-btn { width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid #3b82f6; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1d4ed8; transition: 0.2s; padding: 0; box-shadow: 0 2px 4px rgba(59,130,246,0.1); }
  .em-act-btn:hover { background: #3b82f6; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(59,130,246,0.2); }
  .em-act-btn.delete { color: #ef4444; border-color: #fecaca; }
  .em-act-btn.delete:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
  .em-act-btn svg { width: 16px; height: 16px; stroke-width: 2.5px; }

  /* Drawer & Overlay */
  .em-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1000; animation: fadeIn 0.3s ease; }
  .em-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 500px; background: #fff; z-index: 1001; box-shadow: -10px 0 40px rgba(0,0,0,0.1); display: flex; flex-direction: column; animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

  .em-drawer-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; background: #fff; }
  .em-drawer-body { flex: 1; overflow-y: auto; padding: 24px; background: #f8fafc; }
  .em-drawer-footer { padding: 20px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; background: #fff; }

  /* Grid Layout for Forms */
  .em-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .em-grid > div:last-child:nth-child(odd) { grid-column: span 2; }

  /* View Text Styles */
  .em-view-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.02em; }
  .em-view-val { font-size: 14px; font-weight: 600; color: #334155; }

  /* Pagination */
  .em-pagination { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfe; }
  .em-pag-info { font-size: 13px; color: #64748b; }
  .em-pag-btns { display: flex; gap: 8px; }
  .em-pag-btn { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; font-size: 13px; cursor: pointer; color: #334155; transition: 0.2s; }
  .em-pag-btn:hover:not(:disabled) { background: #f8fafc; border-color: #3b82f6; color: #3b82f6; }
  .em-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .em-pag-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

  /* Drawer Navigation & Design */
  .em-drawer-nav { padding: 12px 24px; border-bottom: 1px solid #f1f5f9; background: #fff; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; }
  .em-drawer-nav-text { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
  .em-drawer-nav-btns { display: flex; gap: 8px; }
  .em-nav-btn { height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; color: #475569; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
  .em-nav-btn:hover:not(:disabled) { background: #f8fafc; color: #3b82f6; border-color: #3b82f6; }
  .em-nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .em-section-group { margin-bottom: 24px; background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
  .em-section-title { font-size: 13px; font-weight: 700; color: #3b82f6; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; }
  .em-section-line { height: 1px; background: #eff6ff; flex: 1; }

  .em-drawer-field { margin-bottom: 4px; }
  .em-drawer-input { width: 100%; height: 38px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #f8fafc; outline: none; font-size: 13.5px; box-sizing: border-box; transition: 0.2s; font-family: inherit; }
  .em-drawer-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  .ob-btn { height: 40px; padding: 0 20px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; }
  .ob-btn-primary { background: #1d4ed8; color: #fff; }
  .ob-btn-primary:hover { background: #1e40af; }

  .em-toast { position: fixed; bottom: 24px; right: 24px; background: #1e293b; color: #fff; padding: 12px 20px; border-radius: 8px; z-index: 2000; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

/* ─────────────────────────────────────────────
   MAPPERS & HELPERS
 ───────────────────────────────────────────── */
function mapBackendToManaged(b: any): ManagedEmployee {
  return {
    id: b.id,
    empId: b.employee_id || "PENDING",
    title: b.title || "",
    firstName: b.first_name,
    lastName: b.last_name,
    officialEmail: b.user_email,
    personalEmail: "",
    phone: b.user_contact || "",
    gender: b.personal_detail?.gender || "Male",
    dob: b.personal_detail?.date_of_birth || "",
    bloodGroup: b.personal_detail?.blood_group || "",
    hrDepartment: b.work_detail?.department?.name || "No Department",
    hrDepartmentId: b.work_detail?.department?.id || b.work_detail?.department?._id || "",
    academicsDepartment: "No Department",
    designation: b.work_detail?.designation?.name || "Staff",
    designationId: b.work_detail?.designation?.id || b.work_detail?.designation?._id || "",
    employmentType: b.work_detail?.employee_type || "Regular",
    employmentSubType: b.work_detail?.employee_sub_type || "",
    category: b.personal_detail?.category || "",
    hiringSource: b.work_detail?.hiring_source || "",
    experienceYears: "",
    experienceMonths: "",
    previousQualification: "",
    joiningDate: b.work_detail?.date_of_joining || "",
    reportingManager: "",
    workLocation: b.address?.city || "",
    fatherName: b.personal_detail?.father_name || "",
    aadhaar: b.personal_detail?.aadhar_no || "",
    pan: b.personal_detail?.pan_no || "",
    passport: b.personal_detail?.passport_no || "",
    pfNumber: b.personal_detail?.pf_no || "",
    esicNumber: b.personal_detail?.esic_no || "",
    maritalStatus: b.personal_detail?.marital_status || "Single",
    religion: b.personal_detail?.religion || "",
    caste: b.personal_detail?.caste || "",
    personalCategory: b.personal_detail?.personal_category || "",
    secondaryEmail: "",
    secondaryContact: "",
    scholarLink: "",
    linkedinLink: "",
    addressLine1: b.address?.address_line1 || "",
    addressLine2: b.address?.address_line2 || "",
    country: b.address?.country || "India",
    state: b.address?.state || "",
    city: b.address?.city || "",
    pinCode: b.address?.pin_code || "",
    status: (b.app_status === "active" ? "Active" : b.app_status === "on-leave" ? "On Leave" : "Resigned") as EmpStatus,
    role: (b.app_role === "Admin" ? "HR Admin" : b.app_role === "DeptAdmin" ? "Department Admin" : "Employee") as EmpRole,
    documents: [],
    salaryGrade: "",
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    bankDetails: (b.bank_detail || []).map((bank: any) => ({
      bank_name: bank.bank_name || "",
      account_no: bank.account_no || "",
      ifsc: bank.ifsc || "",
      bank_type: bank.bank_type || "Primary"
    }))
  };
}

function getInitials(first: string, last: string): string {
  return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
}

/* ─────────────────────────────────────────────
   COMPONENTS
 ───────────────────────────────────────────── */

function EditableField({ label, value, isEdit, type = "text", options, onChange }: { label: string; value: string; isEdit: boolean; type?: string; options?: (string | {value: string; label: string})[]; onChange: (v: string) => void }) {
  return (
    <div className="em-drawer-field">
      <div className="em-view-label">{label}</div>
      {isEdit ? (
        options ? (
          <select className="em-drawer-input" value={value} onChange={e => onChange(e.target.value)}>
            <option value="">Select {label}</option>
            {options.map(o => {
              const val = typeof o === 'string' ? o : o.value;
              const lbl = typeof o === 'string' ? o : o.label;
              return <option key={val} value={val}>{lbl}</option>;
            })}
          </select>
        ) : (
          <input className="em-drawer-input" type={type} value={value} onChange={e => onChange(e.target.value)} />
        )
      ) : (
        <div className="em-view-val">{type === "date" ? formatDateForDisplay(value) : (value || "—")}</div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="em-section-group">
      <div className="em-section-title">{title} <div className="em-section-line" /></div>
      <div className="em-grid">{children}</div>
    </div>
  );
}

export default function EmployeeManagement() {
  const navigate = useNavigate();
  /* Pagination State */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [employees, setEmployees] = useState<ManagedEmployee[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "", status: "All", department: "All", employmentType: "All", role: "All"
  });
  
  /* Feature States */
  const [drawerEmp, setDrawerEmp] = useState<ManagedEmployee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"Basic" | "Personal" | "Work" | "Bank">("Basic");
  const [editForm, setEditForm] = useState<ManagedEmployee | null>(null);

  const { data: employeesData, loading, refetch: refetchEmployees } = useQuery<any>(GET_EMPLOYEES, {
    fetchPolicy: 'network-only',
    variables: {
      status: filters.status === "All" ? null : filters.status.toLowerCase(),
      department: filters.department === "All" ? null : filters.department,
      search: filters.search || null,
      pagination: {
        page: currentPage,
        limit: itemsPerPage
      }
    }
  });
  const { data: settingsData } = useQuery<any>(GET_SETTINGS);
  const [updateEmployee, { loading: updating }] = useMutation(UPDATE_EMPLOYEE);
  
  const [toast, setToast] = useState("");

  const departments = useMemo(() => (settingsData?.settings?.departments || []), [settingsData]);
  const employeeTypes = useMemo(() => ["All", ...(settingsData?.settings?.employee_types?.map((t:any)=>t.name) || [])], [settingsData]);

  useEffect(() => {
    if (employeesData?.getAllEmployees?.items) {
      setEmployees(employeesData.getAllEmployees.items.map(mapBackendToManaged));
    }
  }, [employeesData]);

  const totalPages = employeesData?.getAllEmployees?.pageInfo?.totalPages || 1;
  const totalCount = employeesData?.getAllEmployees?.pageInfo?.totalCount || 0;

  const handleAction = (emp: ManagedEmployee, mode: 'view' | 'edit') => {
    if (mode === 'view') {
      navigate(`/employees/${emp.id}`);
      return;
    }
    setDrawerEmp(emp);
    setEditForm(JSON.parse(JSON.stringify(emp))); // Deep clone for editing
    setIsEditMode(mode === 'edit');
    setActiveTab("Basic"); // Reset to first tab
  };

  const handleUpdate = async () => {
    if (!editForm) return;
    try {
      await updateEmployee({
        variables: {
          id: editForm.id,
          input: {
            first_name: editForm.firstName,
            last_name: editForm.lastName,
            user_email: editForm.officialEmail,
            user_contact: editForm.phone,
            personal_detail: {
              date_of_birth: editForm.dob,
              gender: editForm.gender,
              marital_status: editForm.maritalStatus,
              blood_group: editForm.bloodGroup,
              aadhar_no: editForm.aadhaar,
              pan_no: editForm.pan,
            },
            work_detail: {
              designation: editForm.designationId,
              department: editForm.hrDepartmentId,
              employee_type: editForm.employmentType,
              date_of_joining: editForm.joiningDate,
            }
          }
        }
      });
      setToast("Employee updated successfully!");
      refetchEmployees();
      setDrawerEmp(null);
      setTimeout(() => setToast(""), 3000);
    } catch (err: any) {
      const msg = err.graphQLErrors?.[0]?.message || err.message || "Something went wrong";
      setToast(`Error: ${msg}`);
      setTimeout(() => setToast(""), 5000);
    }
  };

  if (loading && employees.length === 0) return <div className="em-container">Loading...</div>;

  return (
    <div className="em-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      
      <div className="em-header">
        <h1 className="em-title">Employee Management</h1>
        <p className="em-subtitle">View and manage all organization resources</p>
      </div>

      <div className="em-stats">
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{background: "#eff6ff"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div><div className="em-stat-val">{totalCount}</div><div className="em-stat-lbl">Total Employees</div></div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{background: "#f0fdf4"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div><div className="em-stat-val">{employeesData?.getAllEmployees?.activeCount || 0}</div><div className="em-stat-lbl">Active Now</div></div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon" style={{background: "#fffbeb"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div><div className="em-stat-val">{employeesData?.getAllEmployees?.onLeaveCount || 0}</div><div className="em-stat-lbl">On Leave</div></div>
        </div>
      </div>

      <div className="em-table-card">
        <div className="em-filter-bar">
          <input className="em-search" placeholder="Search by name or ID..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          <select className="em-select" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
          </select>
          <select className="em-select" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
            <option value="All">All Departments</option>
            {departments.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="em-select" value={filters.employmentType} onChange={e => setFilters({...filters, employmentType: e.target.value})}>
            {employeeTypes.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
          </select>
        </div>

        <div className="em-table-wrap">
          <table className="em-table">
            <thead>
              <tr>
                <th>Dept & Designation</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="em-emp-cell">
                      <div className="em-avatar" style={{background: emp.avatarColor}}>{getInitials(emp.firstName, emp.lastName)}</div>
                      <div>
                        <div style={{fontWeight: 700}}>{emp.firstName} {emp.lastName}</div>
                        <div style={{fontSize: 12, color: "#64748b"}}>{emp.empId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight: 500}}>{emp.hrDepartment}</div>
                    <div style={{fontSize: 12, color: "#64748b"}}>{emp.designation}</div>
                  </td>
                  <td>{emp.employmentType}</td>
                  <td><span className={`em-badge ${emp.status === "Active" ? "em-status-active" : "em-status-leave"}`}>{emp.status}</span></td>
                  <td>
                    <div className="em-actions">
                      <button className="em-act-btn" title="View Profile" onClick={() => handleAction(emp, 'view')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="em-act-btn" title="Edit Profile" onClick={() => handleAction(emp, 'edit')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center', padding: 40, color: '#94a3b8'}}>No employees found matching the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalCount > itemsPerPage && (
          <div className="em-pagination">
            <div className="em-pag-info">
              Showing {(currentPage-1)*itemsPerPage+1} to {Math.min(currentPage*itemsPerPage, totalCount)} of {totalCount} employees
            </div>
            <div className="em-pag-btns">
              <button className="em-pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(n => (
                <button key={n} className={`em-pag-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
              ))}
              <button className="em-pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {drawerEmp && editForm && (
        <>
          <div className="em-overlay" onClick={() => setDrawerEmp(null)} />
          <div className="em-drawer">
            <div className="em-drawer-header">
              <div className="em-emp-cell">
                <div className="em-avatar" style={{background: drawerEmp.avatarColor, width: 64, height: 64, fontSize: 24, flexShrink: 0}}>{getInitials(drawerEmp.firstName, drawerEmp.lastName)}</div>
                <div>
                  <h2 style={{margin: 0, fontSize: 20}}>{drawerEmp.title} {drawerEmp.firstName} {drawerEmp.lastName}</h2>
                  <div style={{color: "#64748b", fontSize: 14}}>{drawerEmp.empId} • {drawerEmp.designation}</div>
                </div>
              </div>
              <div style={{display:'flex', gap: 10}}>
                {!isEditMode && <button className="ob-btn-primary" style={{height: 32, padding:'0 12px', fontSize: 12, borderRadius: 6, fontWeight: 700}} onClick={() => setIsEditMode(true)}>Edit Profile</button>}
                <button className="em-act-btn" style={{borderColor: '#e2e8f0', color: '#64748b'}} onClick={() => setDrawerEmp(null)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            </div>

            <div className="em-drawer-nav">
              <div className="em-tabs" style={{display: 'flex', gap: '4px'}}>
                {(['Basic', 'Personal', 'Work', 'Bank'] as const).map(tab => (
                  <button 
                    key={tab} 
                    className={`em-nav-btn ${activeTab === tab ? 'active' : ''}`}
                    style={activeTab === tab ? {background: '#3b82f6', color: '#fff', borderColor: '#3b82f6'} : {}}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="em-drawer-body">
              {activeTab === "Basic" && (
                <Section title="Basic Contact Information">
                  <EditableField label="Title" value={editForm.title} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, title: v})} />
                  <EditableField label="First Name" value={editForm.firstName} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, firstName: v})} />
                  <EditableField label="Last Name" value={editForm.lastName} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, lastName: v})} />
                  <EditableField label="Official Email" value={editForm.officialEmail} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, officialEmail: v})} />
                  <EditableField label="Phone Number" value={editForm.phone} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, phone: v})} />
                </Section>
              )}

              {activeTab === "Personal" && (
                <Section title="Personal Details">
                  <EditableField label="Date of Birth" value={editForm.dob} isEdit={isEditMode} type="date" onChange={(v: string) => setEditForm({...editForm, dob: v})} />
                  <EditableField label="Gender" value={editForm.gender} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, gender: v})} />
                  <EditableField label="Father's Name" value={editForm.fatherName} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, fatherName: v})} />
                  <EditableField label="Marital Status" value={editForm.maritalStatus} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, maritalStatus: v})} />
                  <EditableField label="Blood Group" value={editForm.bloodGroup} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, bloodGroup: v})} />
                  <EditableField label="Religion" value={editForm.religion} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, religion: v})} />
                  <EditableField label="Caste" value={editForm.caste} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, caste: v})} />
                  <EditableField label="Category" value={editForm.category} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, category: v})} />
                  <EditableField label="Aadhaar No" value={editForm.aadhaar} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, aadhaar: v})} />
                  <EditableField label="PAN No" value={editForm.pan} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, pan: v})} />
                </Section>
              )}

              {activeTab === "Work" && (
                <Section title="Employment & Work">
                  <EditableField label="Joining Date" value={editForm.joiningDate} isEdit={isEditMode} type="date" onChange={(v: string) => setEditForm({...editForm, joiningDate: v})} />
                  <EditableField 
                    label="Department" 
                    value={editForm.hrDepartmentId} 
                    isEdit={isEditMode} 
                    options={departments.map((d:any)=>({ value: d.id, label: d.name }))} 
                    onChange={(v: string) => {
                      const dept = departments.find((d:any) => d.id === v);
                      setEditForm({...editForm, hrDepartmentId: v, hrDepartment: dept?.name || ""});
                    }} 
                  />
                  <EditableField 
                    label="Designation" 
                    value={editForm.designationId} 
                    isEdit={isEditMode} 
                    options={(settingsData?.settings?.designations || []).map((d:any)=>({ value: d.id, label: d.name }))} 
                    onChange={(v: string) => {
                      const desg = settingsData?.settings?.designations?.find((d:any) => d.id === v);
                      setEditForm({...editForm, designationId: v, designation: desg?.name || ""});
                    }} 
                  />
                  <EditableField label="Employment Type" value={editForm.employmentType} isEdit={isEditMode} options={employeeTypes.filter(t=>t!=="All")} onChange={(v: string) => setEditForm({...editForm, employmentType: v})} />
                  <EditableField label="Work Location" value={editForm.workLocation} isEdit={isEditMode} onChange={(v: string) => setEditForm({...editForm, workLocation: v})} />
                </Section>
              )}

              {activeTab === "Bank" && (
                <Section title="Bank Detail">
                  {editForm.bankDetails?.length > 0 ? (
                    editForm.bankDetails.map((bank, idx) => (
                      <div key={idx} style={{gridColumn: 'span 2', background: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '12px'}}>
                        <div style={{fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '8px'}}>{bank.bank_type} Account</div>
                        <div className="em-grid">
                          <EditableField label="Bank Name" value={bank.bank_name} isEdit={isEditMode} onChange={(v: string) => {
                            const newBanks = [...editForm.bankDetails];
                            newBanks[idx] = {...newBanks[idx], bank_name: v};
                            setEditForm({...editForm, bankDetails: newBanks});
                          }} />
                          <EditableField label="Account No" value={bank.account_no} isEdit={isEditMode} onChange={(v: string) => {
                            const newBanks = [...editForm.bankDetails];
                            newBanks[idx] = {...newBanks[idx], account_no: v};
                            setEditForm({...editForm, bankDetails: newBanks});
                          }} />
                          <EditableField label="IFSC Code" value={bank.ifsc} isEdit={isEditMode} onChange={(v: string) => {
                            const newBanks = [...editForm.bankDetails];
                            newBanks[idx] = {...newBanks[idx], ifsc: v};
                            setEditForm({...editForm, bankDetails: newBanks});
                          }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No bank details provided.</div>
                  )}
                </Section>
              )}
            </div>

            <div className="em-drawer-footer">
              <button className="ob-btn" style={{background: "#fff", border: "1.5px solid #e2e8f0", color: "#64748b"}} onClick={() => setDrawerEmp(null)}>{isEditMode ? 'Cancel' : 'Close'}</button>
              {isEditMode && <button className="ob-btn-primary ob-btn" onClick={handleUpdate} disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>}
            </div>
          </div>
        </>
      )}

      {toast && <div className="em-toast">{toast}</div>}
    </div>
  );
}
