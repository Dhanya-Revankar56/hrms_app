import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_EMPLOYEE_BY_ID } from "../graphql/employeeQueries";
import { GET_SALARY_RECORD } from "../graphql/payrollQueries";
import { GET_ATTENDANCES } from "../graphql/attendanceQueries";
import { GET_LEAVES, GET_LEAVE_BALANCES, APPLY_LEAVE } from "../graphql/leaveQueries";
import { GET_MOVEMENTS, CREATE_MOVEMENT } from "../graphql/movementQueries";
import { GET_EMPLOYEE_DOCUMENTS } from "../graphql/documentQueries";
import { GET_SETTINGS } from "../graphql/settingsQueries";
import { formatDateForDisplay } from "../utils/dateUtils";
import AnalogTimePicker from "../components/AnalogTimePicker";

const CSS = `
  .ed-container { padding: 24px; font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }
  .ed-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; }
  
  .ed-avatar-box { width: 80px; height: 80px; border-radius: 16px; background: #1e293b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
  .ed-info-main { flex: 1; }
  .ed-name-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .ed-name { font-size: 20px; font-weight: 700; color: #1e293b; }
  .ed-status-badge { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .ed-meta { font-size: 14px; color: #64748b; display: flex; gap: 12px; align-items: center; }
  .ed-meta-sep { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }

  .ed-tabs-row { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px; background: #f1f5f9; padding: 4px; border-radius: 10px; width: fit-content; overflow-x: auto; }
  .ed-tab { padding: 8px 16px; border: none; background: transparent; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 8px; transition: 0.2s; white-space: nowrap; }
  .ed-tab:hover { color: #1e293b; }
  .ed-tab.active { background: #fff; color: #1d4ed8; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

  .ed-content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .ed-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .ed-sec-title { font-size: 14px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
  
  .ed-field { margin-bottom: 14px; }
  .ed-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
  .ed-value { font-size: 14px; font-weight: 600; color: #334155; }

  .ed-back-btn { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 20px; background: none; border: none; padding: 0; }
  .ed-back-btn:hover { color: #1e293b; }

  .ed-table { width: 100%; border-collapse: collapse; }
  .ed-table th { text-align: left; padding: 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; background: #fafbfe; }
  .ed-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
  
  .ed-salary-card { display: flex; flex-direction: column; gap: 12px; }
  .ed-salary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
  .ed-salary-item:last-child { border-bottom: none; }

  .ed-time-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border: 1.5px solid #dbeafe;
    border-radius: 8px;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
    cursor: pointer;
    transition: all 0.1s;
  }
  .ed-time-trigger:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  .ed-time-trigger svg { color: #64748b; }
  .ed-time-trigger:hover svg { color: #3b82f6; }
  .ed-salary-lbl { font-size: 13px; color: #64748b; font-weight: 500; }
  .ed-salary-val { font-size: 14px; color: #1e293b; font-weight: 700; }

  /* Leave Breakdown */
  .ed-leave-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .ed-leave-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .ed-leave-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border-color: #3b82f6; }
  .ed-leave-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
  .ed-leave-info { flex: 1; min-width: 0; }
  .ed-leave-type { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ed-leave-stats { font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 2px; }
  .ed-leave-used { font-size: 11px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .ed-used-val { color: #3b82f6; font-weight: 700; }

  .ed-filter-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .ed-filter-item { display: flex; flex-direction: column; gap: 4px; }
  .ed-filter-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
  .ed-select { height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; background: #f8fafc; outline: none; transition: 0.2s; }
  .ed-select:focus { border-color: #3b82f6; background: #fff; }
  .ed-date-input { height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; background: #f8fafc; outline: none; }

  .ed-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #e2e8f0; background: #fff; color: #334155; transition: 0.2s; }
  .ed-btn-primary { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
  .ed-btn-primary:hover { background: #1e40af; }

  .ed-pill { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap; }

  /* Modal */
  .ed-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .ed-modal { background: #fff; border-radius: 16px; width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
  .ed-modal-head { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  .ed-modal-title { font-size: 16px; font-weight: 700; color: #1e293b; }
  .ed-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .ed-modal-foot { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }

  /* Segmented Control / Toggle */
  .ed-toggle-group { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px; }
  .ed-toggle-btn { flex: 1; border: none; background: transparent; padding: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 7px; transition: 0.2s; }
  .ed-toggle-btn.active { background: #fff; color: #1d4ed8; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

  /* Session Selector */
  .ed-session-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ed-session-option { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
  .ed-session-option:hover { border-color: #cbd5e1; background: #f8fafc; }
  .ed-session-option.active { border-color: #1d4ed8; background: #eff6ff; }
  .ed-radio-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
  .ed-session-option.active .ed-radio-dot { border-color: #1d4ed8; }
  .ed-session-option.active .ed-radio-dot::after { content: ''; width: 6px; height: 6px; background: #1d4ed8; border-radius: 50%; }
  .ed-session-label { font-size: 13px; font-weight: 600; color: #334155; }
  .ed-session-sub { font-size: 11px; color: #64748b; margin-top: 1px; }

  /* Movement status — pill with dot */
  .ed-mv-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:99px;
    font-size:11px; font-weight:700; white-space:nowrap;
    text-transform: uppercase;
  }
  .ed-mv-badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.75; }
  .ed-mv-pending  { background:#fffbeb; color:#b45309; }
  .ed-mv-approved { background:#f0fdf4; color:#15803d; }
  .ed-mv-rejected { background:#fef2f2; color:#dc2626; }
  /* Alerts */
  .ed-alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; animation: ed-slide-down 0.3s ease-out; }
  .ed-alert-error { background: #fef2f2; color: #dc2626; border: 1.5px solid #fee2e2; }
  .ed-alert-success { background: #f0fdf4; color: #16a34a; border: 1.5px solid #dcfce7; }
  @keyframes ed-slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;

/* ─────────────────────────────────────────────
   INTERFACES
   ───────────────────────────────────────────── */
interface Employee {
  id: string;
  employee_id: string;
  title: string;
  first_name: string;
  last_name: string;
  user_email: string;
  user_contact: string;
  app_status: string;
  work_detail?: {
    designation?: { name: string };
    department?: { name: string };
    employee_type?: string;
    date_of_joining?: string;
  };
  personal_detail?: {
    gender?: string;
    date_of_birth?: string;
    marital_status?: string;
    aadhar_no?: string;
    pan_no?: string;
    pf_no?: string;
    esic_no?: string;
  };
  bank_detail?: Array<{
    bank_type: string;
    bank_name: string;
    account_no: string;
    ifsc: string;
  }>;
  reporting_to?: {
    first_name: string;
    last_name: string;
  };
}

interface SalaryRecord {
  monthly_ctc: number;
  annual_ctc: number;
  net_monthly_salary: number;
  net_annual_salary: number;
  earnings: {
    basic: number;
    agp: number;
    da: number;
    hra: number;
  };
}

interface Attendance {
  id: string;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
  working_hours: number;
}

interface LeaveApproval {
  role: string;
  status: string;
}

interface Leave {
  id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  document_url?: string;
  requested_date?: string;
  created_at?: string;
  status: string;
  approvals: LeaveApproval[];
}

interface Movement {
  id: string;
  movement_date: string;
  movement_type: string;
  out_time: string;
  in_time?: string;
  purpose?: string;
  remarks?: string;
  status?: string;
}

interface EmployeeDocument {
  id: string;
  name: string;
  created_at: string;
  file_url: string;
}

interface Settings {
  leave_types: Array<{ name: string; total_days: number }>;
}

type TabType = "Summary" | "Salary Details" | "Payslips" | "Attendance" | "Movements" | "Leaves" | "Documents";

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("Summary");

  const { data: empData, loading: empLoading } = useQuery<{ employee: Employee }>(GET_EMPLOYEE_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only'
  });

  const { data: settingsData } = useQuery<{ settings: Settings }>(GET_SETTINGS);
  const leaveTypes = settingsData?.settings?.leave_types || [];

  const { data: salaryData } = useQuery<{ salaryRecord: SalaryRecord }>(GET_SALARY_RECORD, {
    variables: { employee_id: id },
    skip: activeTab !== "Salary Details" && activeTab !== "Summary",
  });

  const { data: attendanceData } = useQuery<{ attendances: { items: Attendance[] } }>(GET_ATTENDANCES, {
    variables: { employee_id: id },
    skip: activeTab !== "Attendance",
  });

  const { data: leavesData } = useQuery<{ leaves: { items: Leave[] } }>(GET_LEAVES, {
    variables: { employee_id: id },
    skip: activeTab !== "Leaves",
  });

  useQuery<{ leaveBalances: Array<{ leave_type: string; balance: number }> }>(GET_LEAVE_BALANCES, {
    variables: { employee_id: id },
    skip: activeTab !== "Leaves",
  });

  const [applyLeave] = useMutation(APPLY_LEAVE, {
    refetchQueries: [{ query: GET_LEAVES, variables: { employee_id: id } }, { query: GET_LEAVE_BALANCES, variables: { employee_id: id } }]
  });

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [applyForm, setApplyForm] = useState({
    leave_type: "",
    from_date: "",
    to_date: "",
    reason: "",
    is_half_day: false,
    half_day_type: ""
  });

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showRet, setShowRet] = useState(false);
  const [mStatus, setMStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [moveForm, setMoveForm] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    movement_type: "official",
    out_time: "",
    in_time: "",
    purpose: ""
  });

  const [applyMovement, { loading: mLoading }] = useMutation<{ createMovement: Movement }, { input: {
    employee_id: string;
    movement_date: string;
    movement_type: string;
    out_time: string;
    in_time?: string;
    purpose?: string;
    remarks?: string;
  } }>(CREATE_MOVEMENT, {
    refetchQueries: ["GetMovements"]
  });


  const { data: movementsData } = useQuery<{ movements: { items: Movement[] } }>(GET_MOVEMENTS, {
    variables: { employee_id: id },
    skip: activeTab !== "Movements",
  });

  const { data: docsData } = useQuery<{ employeeDocuments: EmployeeDocument[] }>(GET_EMPLOYEE_DOCUMENTS, {
    variables: { employee_id: id },
    skip: activeTab !== "Documents",
  });
  const getLeaveCode = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("casual")) return "CL";
    if (n.includes("official duty")) return "OOD";
    if (n.includes("sick")) return "SL";
    if (n.includes("paid")) return "PL";
    if (n.includes("maternity") || n.includes("meternity")) return "ML";
    if (n.includes("paternity")) return "Pat_L";
    return name;
  };

  const getLeaveName = (type: string) => {
    const code = getLeaveCode(type);
    const names: Record<string, string> = {
      "CL": "Casual Leave",
      "OOD": "On Official Duty",
      "SL": "Sick Leave",
      "PL": "Paid Leave",
      "ML": "Maternity Leave",
      "Pat_L": "Paternity Leave"
    };
    return names[code] || type;
  };

  const getLeaveMeta = (code: string) => {
    const meta: Record<string, { bg: string; color: string }> = {
      "CL":    { bg: "#eff6ff", color: "#1d4ed8" },
      "OOD":   { bg: "#f0fdff", color: "#0891b2" },
      "SL":    { bg: "#fffbeb", color: "#b45309" },
      "PL":    { bg: "#f0fdf4", color: "#15803d" },
      "ML":    { bg: "#fdf2f8", color: "#db2777" },
      "Pat_L": { bg: "#f5f3ff", color: "#7c3aed" },
      "Other": { bg: "#f8fafc", color: "#64748b" },
    };
    return meta[code] || meta["Other"];
  };

  const getUsedCount = (typeName: string, leaves: Leave[] = []) => {
    const targetCode = getLeaveCode(typeName);
    return leaves
      .filter((l) => {
        const lCode = getLeaveCode(l.leave_type);
        return lCode === targetCode && (l.status || "").toLowerCase() === 'approved';
      })
      .reduce((sum: number, l) => sum + (l.total_days || 0), 0);
  };

  const to12 = (t: string): string => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ap}`;
  };

  const tdiff = (a: string, b: string): string => {
    if (!a || !b) return "—";
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const d = (bh * 60 + bm) - (ah * 60 + am);
    if (d <= 0) return "—";
    return Math.floor(d / 60) > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : `${d}m`;
  };

  const employee = empData?.employee;
  const salary = salaryData?.salaryRecord;

  if (empLoading) return <div className="ed-container">Loading details...</div>;
  if (!employee) return <div className="ed-container">Employee not found.</div>;

  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="ed-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      
      <button className="ed-back-btn" onClick={() => navigate("/employees")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Employees
      </button>

      <div className="ed-header-card">
        <div className="ed-avatar-box">{initials}</div>
        <div className="ed-info-main">
          <div className="ed-name-row">
            <h1 className="ed-name">{employee.title} {employee.first_name} {employee.last_name}</h1>
            <span className="ed-status-badge">{employee.app_status}</span>
          </div>
          <div className="ed-meta">
            <span>{employee.work_detail?.designation?.name || "Staff"}</span>
            <div className="ed-meta-sep" />
            <span>{employee.employee_id}</span>
            <div className="ed-meta-sep" />
            <span>{employee.work_detail?.department?.name || "No Department"}</span>
          </div>
        </div>
      </div>

      <div className="ed-tabs-row">
        {(["Summary", "Salary Details", "Payslips", "Attendance", "Movements", "Leaves", "Documents"] as TabType[]).map(tab => (
          <button 
            key={tab} 
            className={`ed-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ed-content">
        {activeTab === "Summary" && (
          <div className="ed-content-grid">
            <div className="ed-section">
              <h2 className="ed-sec-title">Work & Organization</h2>
              <div className="ed-field"><div className="ed-label">Department</div><div className="ed-value">{employee.work_detail?.department?.name || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Designation</div><div className="ed-value">{employee.work_detail?.designation?.name || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Employee Type</div><div className="ed-value">{employee.work_detail?.employee_type || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Date of Joining</div><div className="ed-value">{formatDateForDisplay(employee.work_detail?.date_of_joining) || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Reporting Manager</div><div className="ed-value">{employee.reporting_to ? `${employee.reporting_to.first_name} ${employee.reporting_to.last_name}` : "—"}</div></div>
            </div>
            <div className="ed-section">
              <h2 className="ed-sec-title">Personal Details</h2>
              <div className="ed-field"><div className="ed-label">Gender</div><div className="ed-value">{employee.personal_detail?.gender || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Date of Birth</div><div className="ed-value">{formatDateForDisplay(employee.personal_detail?.date_of_birth) || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">Official Email</div><div className="ed-value">{employee.user_email}</div></div>
              <div className="ed-field"><div className="ed-label">Phone Number</div><div className="ed-value">{employee.user_contact}</div></div>
              <div className="ed-field"><div className="ed-label">Marital Status</div><div className="ed-value">{employee.personal_detail?.marital_status || "—"}</div></div>
            </div>
            <div className="ed-section">
              <h2 className="ed-sec-title">Identification</h2>
              <div className="ed-field"><div className="ed-label">Aadhar No</div><div className="ed-value">{employee.personal_detail?.aadhar_no || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">PAN No</div><div className="ed-value">{employee.personal_detail?.pan_no || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">PF No</div><div className="ed-value">{employee.personal_detail?.pf_no || "—"}</div></div>
              <div className="ed-field"><div className="ed-label">ESIC No</div><div className="ed-value">{employee.personal_detail?.esic_no || "—"}</div></div>
            </div>
            <div className="ed-section">
              <h2 className="ed-sec-title">Bank Details</h2>
              {employee.bank_detail && employee.bank_detail.length > 0 ? (
                employee.bank_detail.map((bank, idx) => (
                  <div key={idx} style={{marginBottom: 16, borderBottom: employee.bank_detail && idx < employee.bank_detail.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: 8}}>
                    <div style={{fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>{bank.bank_type} Account</div>
                    <div className="ed-field" style={{marginTop: 8}}><div className="ed-label">Bank Name</div><div className="ed-value">{bank.bank_name}</div></div>
                    <div className="ed-field"><div className="ed-label">Account No</div><div className="ed-value">{bank.account_no}</div></div>
                    <div className="ed-field"><div className="ed-label">IFSC Code</div><div className="ed-value">{bank.ifsc}</div></div>
                  </div>
                ))
              ) : (
                <div style={{color: '#94a3b8', fontSize: 13}}>No bank details available.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Salary Details" && (
          <div className="ed-content-grid">
            <div className="ed-section">
              <h2 className="ed-sec-title">Current Salary Structure</h2>
              <div className="ed-salary-card">
                <div className="ed-salary-item"><span className="ed-salary-lbl">Monthly CTC</span><span className="ed-salary-val">₹{salary?.monthly_ctc?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">Annual CTC</span><span className="ed-salary-val">₹{salary?.annual_ctc?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">Net Monthly Salary</span><span className="ed-salary-val">₹{salary?.net_monthly_salary?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">Net Annual Salary</span><span className="ed-salary-val">₹{salary?.net_annual_salary?.toLocaleString() || "0"}</span></div>
              </div>
            </div>
            <div className="ed-section">
              <h2 className="ed-sec-title">Earnings Breakdown</h2>
              <div className="ed-salary-card">
                <div className="ed-salary-item"><span className="ed-salary-lbl">Basic</span><span className="ed-salary-val">₹{salary?.earnings?.basic?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">AGP</span><span className="ed-salary-val">₹{salary?.earnings?.agp?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">DA</span><span className="ed-salary-val">₹{salary?.earnings?.da?.toLocaleString() || "0"}</span></div>
                <div className="ed-salary-item"><span className="ed-salary-lbl">HRA</span><span className="ed-salary-val">₹{salary?.earnings?.hra?.toLocaleString() || "0"}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Attendance" && (
          <div className="ed-section" style={{overflowX: 'auto'}}>
            <h2 className="ed-sec-title">Attendance Logs</h2>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.attendances?.items?.map((att) => (
                  <tr key={att.id}>
                    <td>{formatDateForDisplay(att.date)}</td>
                    <td>{att.check_in ? to12(att.check_in) : "—"}</td>
                    <td>{att.check_out ? to12(att.check_out) : "—"}</td>
                    <td><span className={`ed-status-badge`} style={{background: att.status === 'Present' ? '#dcfce7' : '#fee2e2', color: att.status === 'Present' ? '#166534' : '#991b1b'}}>{att.status}</span></td>
                    <td>{att.working_hours?.toFixed(1) || "0.0"} hrs</td>
                  </tr>
                ))}
                {(!attendanceData?.attendances?.items || attendanceData.attendances.items.length === 0) && (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: 30, color: '#94a3b8'}}>No attendance records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "Movements" && (
          <div style={{width: '100%'}}>
            <div className="ed-filter-bar" style={{marginBottom: 20}}>
              <div className="ed-filter-item">
                <label className="ed-filter-label">Status Filter</label>
                <select className="ed-select">
                  <option>All</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div style={{marginLeft: 'auto'}}>
                <button className="ed-btn ed-btn-primary" onClick={() => setShowMovementModal(true)}>Apply Movement</button>
              </div>
            </div>

            <div className="ed-section" style={{overflowX: 'auto'}}>
              <h2 className="ed-sec-title">Movement Log</h2>
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Movement Date</th>
                    <th>Reason</th>
                    <th>Time Range</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsData?.movements?.items?.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateForDisplay(m.movement_date)}</td>
                      <td>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#f1f5f9', color:'#64748b', fontWeight:800, textTransform:'uppercase' }}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight:600 }}>{to12(m.out_time)} - {m.in_time ? to12(m.in_time) : '...'}</div>
                      </td>
                      <td>
                        <span className={`ed-mv-badge ed-mv-${(m.status || "pending").toLowerCase()}`}>
                          {m.status || "PENDING"}
                        </span>
                      </td>
                      <td><div style={{ fontSize:12, color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{m.purpose || m.remarks || '—'}</div></td>
                    </tr>
                  ))}
                  {(!movementsData?.movements?.items || movementsData.movements.items.length === 0) && (
                    <tr><td colSpan={6} style={{textAlign: 'center', padding: 30, color: '#94a3b8'}}>No movement records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === "Leaves" && (
          <div style={{width: '100%'}}>
            <div className="ed-leave-grid">
              {leaveTypes.map((lt: { name: string; total_days: number }) => {
                const code = getLeaveCode(lt.name);
                const meta = getLeaveMeta(code);
                const used = getUsedCount(lt.name, leavesData?.leaves?.items || []);
                const balance = (lt.total_days || 0) - used;
                
                return (
                  <div key={lt.name} className="ed-leave-card">
                    <div className="ed-leave-icon" style={{ background: meta.bg, color: meta.color }}>
                      {code}
                    </div>
                    <div className="ed-leave-info">
                      <div className="ed-leave-type">{getLeaveName(lt.name)}</div>
                      <div className="ed-leave-stats">Bal: {balance}</div>
                      <div className="ed-leave-used">Used: <span className="ed-used-val">{used}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Bar */}
            <div className="ed-filter-bar">
              <div className="ed-filter-item">
                <label className="ed-filter-label">Leave Type</label>
                <select className="ed-select">
                  <option>All</option>
                  {leaveTypes.map((lt: { name: string; total_days: number }) => (
                    <option key={lt.name} value={lt.name}>{getLeaveName(lt.name)}</option>
                  ))}
                </select>
              </div>
              <div className="ed-filter-item">
                <label className="ed-filter-label">Status</label>
                <select className="ed-select">
                  <option>All</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div className="ed-filter-item">
                <label className="ed-filter-label">Start</label>
                <input type="date" className="ed-date-input" />
              </div>
              <div style={{color: '#94a3b8'}}>—</div>
              <div className="ed-filter-item">
                <label className="ed-filter-label">End</label>
                <input type="date" className="ed-date-input" />
              </div>
              <div style={{marginLeft: 'auto'}}>
                <button className="ed-btn ed-btn-primary" onClick={() => setShowApplyModal(true)}>Apply Leaves</button>
              </div>
            </div>

            <div className="ed-section" style={{overflowX: 'auto'}}>
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Leave Date</th>
                    <th>No of days Requested</th>
                    <th>Document</th>
                    <th>Requested date</th>
                    <th>Dept Admin approval</th>
                    <th>Admin approval</th>
                    <th>Leave status</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesData?.leaves?.items?.map((l) => (
                    <tr key={l.id}>
                      <td style={{fontWeight: 600}}>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{fontSize:10, padding:'2px 6px', borderRadius:4, background:'#f1f5f9', color:'#64748b', fontWeight:800}}>
                            {getLeaveCode(l.leave_type)}
                          </span>
                          {getLeaveName(l.leave_type)}
                        </div>
                      </td>
                      <td>{formatDateForDisplay(l.from_date)} - {formatDateForDisplay(l.to_date)}</td>
                      <td>{l.total_days}</td>
                      <td>{l.document_url ? <a href={l.document_url} target="_blank" rel="noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></a> : '-'}</td>
                      <td>{formatDateForDisplay(l.requested_date || l.created_at || "")}</td>
                    {/* Status Columns */}
                    <td>
                      <span className="ed-pill" style={{
                        background: (l.approvals?.find((a) => a.role === 'HOD')?.status === 'approved' ? '#dcfce7' : l.approvals?.find((a) => a.role === 'HOD')?.status === 'rejected' ? '#fee2e2' : '#fef9c3'),
                        color: (l.approvals?.find((a) => a.role === 'HOD')?.status === 'approved' ? '#166534' : l.approvals?.find((a) => a.role === 'HOD')?.status === 'rejected' ? '#991b1b' : '#854d0e')
                      }}>
                        {l.approvals?.find((a) => a.role === 'HOD')?.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span className="ed-pill" style={{
                        background: (l.approvals?.find((a) => a.role === 'ADMIN')?.status === 'approved' ? '#dcfce7' : l.approvals?.find((a) => a.role === 'ADMIN')?.status === 'rejected' ? '#fee2e2' : '#fef9c3'),
                        color: (l.approvals?.find((a) => a.role === 'ADMIN')?.status === 'approved' ? '#166534' : l.approvals?.find((a) => a.role === 'ADMIN')?.status === 'rejected' ? '#991b1b' : '#854d0e')
                      }}>
                        {l.approvals?.find((a) => a.role === 'ADMIN')?.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span className="ed-pill" style={{
                        background: l.status === 'approved' ? '#dcfce7' : l.status === 'rejected' ? '#fee2e2' : l.status === 'closed' ? '#f1f5f9' : '#fef9c3',
                        color: l.status === 'approved' ? '#166534' : l.status === 'rejected' ? '#991b1b' : l.status === 'closed' ? '#475569' : '#854d0e'
                      }}>
                        {l.status || 'pending'}
                      </span>
                    </td>
                    </tr>
                  ))}
                  {(!leavesData?.leaves?.items || leavesData.leaves.items.length === 0) && (
                    <tr><td colSpan={8} style={{textAlign: 'center', padding: 40, color: '#94a3b8'}}>No leave applications found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
              <div className="ed-modal-overlay">
                <div className="ed-modal">
                  <div className="ed-modal-head">
                    <div className="ed-modal-title">Apply Leave</div>
                    <button style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}} onClick={() => setShowApplyModal(false)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="ed-modal-body">
                    {status && (
                      <div className={`ed-alert ed-alert-${status.type}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          {status.type === 'error' ? (
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          ) : (
                            <path d="M20 6L9 17l-5-5" />
                          )}
                        </svg>
                        {status.message}
                      </div>
                    )}
                    
                    <div className="ed-filter-item">
                      <label className="ed-filter-label">Leave Type</label>
                      <select 
                        className="ed-select" 
                        value={applyForm.leave_type || (leaveTypes[0]?.name || "")} 
                        onChange={e => setApplyForm({...applyForm, leave_type: e.target.value})}
                      >
                        {leaveTypes.map((lt: { name: string; total_days: number }) => (
                          <option key={lt.name} value={lt.name}>{getLeaveName(lt.name)} ({lt.total_days} days)</option>
                        ))}
                      </select>
                    </div>
                    <div className="ed-filter-item">
                      <label className="ed-filter-label">Leave Duration</label>
                      <div className="ed-toggle-group">
                        <button 
                          className={`ed-toggle-btn ${!applyForm.is_half_day ? 'active' : ''}`}
                          onClick={() => setApplyForm({...applyForm, is_half_day: false})}
                        >
                          Full Day
                        </button>
                        <button 
                          className={`ed-toggle-btn ${applyForm.is_half_day ? 'active' : ''}`}
                          onClick={() => setApplyForm({...applyForm, is_half_day: true, half_day_type: applyForm.half_day_type || 'first_half'})}
                        >
                          Half Day
                        </button>
                      </div>
                    </div>

                    {applyForm.is_half_day && (
                      <div className="ed-filter-item">
                        <label className="ed-filter-label">Select Session</label>
                        <div className="ed-session-grid">
                          <div 
                            className={`ed-session-option ${applyForm.half_day_type === 'first_half' ? 'active' : ''}`}
                            onClick={() => setApplyForm({...applyForm, half_day_type: 'first_half'})}
                          >
                            <div className="ed-radio-dot" />
                            <div>
                              <div className="ed-session-label">First Half</div>
                              <div className="ed-session-sub">Morning Session</div>
                            </div>
                          </div>
                          <div 
                            className={`ed-session-option ${applyForm.half_day_type === 'second_half' ? 'active' : ''}`}
                            onClick={() => setApplyForm({...applyForm, half_day_type: 'second_half'})}
                          >
                            <div className="ed-radio-dot" />
                            <div>
                              <div className="ed-session-label">Second Half</div>
                              <div className="ed-session-sub">Afternoon Session</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                      <div className="ed-filter-item">
                        <label className="ed-filter-label">{applyForm.is_half_day ? 'Leave Date' : 'From Date'}</label>
                        <input type="date" className="ed-date-input" value={applyForm.from_date} onChange={e => setApplyForm({...applyForm, from_date: e.target.value})} />
                      </div>
                      {!applyForm.is_half_day && (
                        <div className="ed-filter-item">
                          <label className="ed-filter-label">To Date</label>
                          <input type="date" className="ed-date-input" value={applyForm.to_date} onChange={e => setApplyForm({...applyForm, to_date: e.target.value})} />
                        </div>
                      )}
                    </div>
                    <div className="ed-filter-item">
                      <label className="ed-filter-label">Reason</label>
                      <textarea className="ed-select" style={{height: 80, padding: 10, resize: 'none'}} value={applyForm.reason} onChange={e => setApplyForm({...applyForm, reason: e.target.value})} placeholder="Reason for leave..."></textarea>
                    </div>
                  </div>
                  <div className="ed-modal-foot">
                    <button className="ed-btn" onClick={() => {
                      setShowApplyModal(false);
                      setStatus(null);
                    }}>Cancel</button>
                    <button className="ed-btn ed-btn-primary" disabled={empLoading} onClick={async () => {
                      setStatus(null);
                      const newFrom = applyForm.from_date;
                      const newTo = applyForm.is_half_day ? applyForm.from_date : applyForm.to_date;

                      if (!newFrom || !newTo) {
                        setStatus({ message: "Please select dates.", type: 'error' });
                        return;
                      }

                      const start = new Date(newFrom);
                      const end = new Date(newTo);

                      if (end < start) {
                        setStatus({ message: "To Date cannot be before From Date.", type: 'error' });
                        return;
                      }

                      const existingLeaves = leavesData?.leaves?.items || [];
                      const overlap = existingLeaves.some((l) => {
                        const s = (l.status || "").toLowerCase();
                        if (s === 'rejected' || s === 'cancelled') return false;
                        const lStart = new Date(l.from_date);
                        const lEnd = new Date(l.to_date);
                        return (start <= lEnd && end >= lStart);
                      });

                      if (overlap) {
                        setStatus({ message: "You have already applied for leave during this period.", type: 'error' });
                        return;
                      }

                      try {
                        await applyLeave({
                          variables: {
                            input: {
                              ...applyForm,
                              employee_id: id,
                            }
                          }
                        });
                        setStatus({ message: "Leave applied successfully!", type: 'success' });
                        setTimeout(() => {
                          setShowApplyModal(false);
                          setStatus(null);
                          setApplyForm({
                            leave_type: leaveTypes[0]?.name || "",
                            from_date: "",
                            to_date: "",
                            reason: "",
                            is_half_day: false,
                            half_day_type: ""
                          });
                        }, 1500);
                      } catch (err: unknown) {
                        const error = err as { message?: string };
                        setStatus({ message: error.message || "Error applying", type: 'error' });
                      }
                    }}>Submit Application</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}


        {activeTab === "Documents" && (
          <div className="ed-section">
            <h2 className="ed-sec-title">Uploaded Documents <button style={{background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: 11, cursor: 'pointer'}}>Upload New</button></h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 16}}>
              {docsData?.employeeDocuments?.map((doc) => (
                <div key={doc.id} style={{border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: 12}}>
                  <div style={{width: 40, height: 40, background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{doc.name}</div>
                    <div style={{fontSize: 11, color: '#64748b'}}>{formatDateForDisplay(doc.created_at)}</div>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={{color: '#3b82f6'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
                </div>
              ))}
            </div>
            {(!docsData?.employeeDocuments || docsData.employeeDocuments.length === 0) && (
              <div style={{textAlign: 'center', padding: 40, color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0'}}>
                No documents uploaded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "Payslips" && (
          <div className="ed-section">
            <h2 className="ed-sec-title">Monthly Payslips</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              <div style={{color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20}}>No payslips generated yet.</div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Movement Modal (Global) */}
      {showMovementModal && (
        <div className="ed-modal-overlay">
          <div className="ed-modal" style={{ width: 500 }}>
            <div className="ed-modal-head">
              <div className="ed-modal-title">Apply Movement</div>
              <button style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}} onClick={() => setShowMovementModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="ed-modal-body">
              {mStatus && (
                <div className={`ed-alert ed-alert-${mStatus.type}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {mStatus.type === 'error' ? <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /> : <path d="M20 6L9 17l-5-5" />}
                  </svg>
                  {mStatus.message}
                </div>
              )}
              
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Movement Date <span style={{color:'red'}}>*</span></label>
                  <input type="date" className="ed-date-input" value={moveForm.movement_date} onChange={e => setMoveForm({...moveForm, movement_date: e.target.value})} />
                </div>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Type <span style={{color:'red'}}>*</span></label>
                  <select className="ed-select" value={moveForm.movement_type} onChange={e => setMoveForm({...moveForm, movement_type: e.target.value})}>
                    <option value="official">Official</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Out Time <span style={{color:'red'}}>*</span></label>
                  <div className="ed-time-trigger" onClick={() => setShowOut(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {to12(moveForm.out_time)}
                  </div>
                  {showOut && (
                    <AnalogTimePicker 
                      initialTime={moveForm.out_time || "09:00"}
                      onSave={(t) => { setMoveForm({...moveForm, out_time: t}); setShowOut(false); }}
                      onCancel={() => setShowOut(false)}
                    />
                  )}
                </div>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Return By <span style={{color:'red'}}>*</span></label>
                  <div className="ed-time-trigger" onClick={() => setShowRet(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {to12(moveForm.in_time)}
                  </div>
                  {showRet && (
                    <AnalogTimePicker 
                      initialTime={moveForm.in_time || "10:00"}
                      onSave={(t) => { setMoveForm({...moveForm, in_time: t}); setShowRet(false); }}
                      onCancel={() => setShowRet(false)}
                    />
                  )}
                </div>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Duration</label>
                  <div style={{ height:36, padding:'0 10px', background:'#eff6ff', border:'1.5px solid #dbeafe', borderRadius:8, display:'flex', alignItems:'center', fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
                    {tdiff(moveForm.out_time, moveForm.in_time)}
                  </div>
                </div>
              </div>

              <div className="ed-filter-item">
                <label className="ed-filter-label">Purpose / Remarks <span style={{color:'red'}}>*</span></label>
                <textarea className="ed-select" style={{height: 60, padding: 10, resize: 'none'}} value={moveForm.purpose} onChange={e => setMoveForm({...moveForm, purpose: e.target.value})} placeholder="Describe the reason for movement..."></textarea>
              </div>
            </div>
            <div className="ed-modal-foot">
              <button className="ed-btn" onClick={() => setShowMovementModal(false)}>Cancel</button>
              <button className="ed-btn ed-btn-primary" disabled={mLoading} onClick={async () => {
                setMStatus(null);
                if (!moveForm.movement_date) {
                  setMStatus({ message: "Please select a date.", type: 'error' });
                  return;
                }
                const sd = new Date(moveForm.movement_date);
                if (sd.getDay() === 0) {
                  setMStatus({ message: "Movements cannot be applied on Sundays.", type: 'error' });
                  return;
                }
                if (!moveForm.out_time || !moveForm.in_time || !moveForm.purpose.trim()) {
                  setMStatus({ message: "Please fill all required fields.", type: 'error' });
                  return;
                }

                const [outH, outM] = moveForm.out_time.split(":").map(Number);
                const [inH, inM] = moveForm.in_time.split(":").map(Number);
                const nStart = outH * 60 + outM;
                const nEnd   = inH * 60 + inM;

                if (nEnd <= nStart) {
                  setMStatus({ message: "Return time must be after out time.", type: 'error' });
                  return;
                }

                const existMv = movementsData?.movements?.items || [];
                const overlap = existMv.some((m) => {
                  const s = (m.status || "").toLowerCase();
                  if (s === 'rejected' || s === 'cancelled') return false;
                  if (m.movement_date.split('T')[0] !== moveForm.movement_date) return false;
                  const [exOH, exOM] = m.out_time.split(":").map(Number);
                  const [exIH, exIM] = (m.in_time || "23:59").split(":").map(Number);
                  const eStart = exOH * 60 + exOM;
                  const eEnd   = exIH * 60 + exIM;
                  return (nStart < eEnd && nEnd > eStart);
                });

                if (overlap) {
                  setMStatus({ message: "You already have a movement scheduled during this time.", type: 'error' });
                  return;
                }
                try {
                  await applyMovement({
                    variables: {
                      input: {
                        employee_id: id || "",
                        movement_date: moveForm.movement_date,
                        movement_type: moveForm.movement_type,
                        out_time: moveForm.out_time,
                        in_time: moveForm.in_time || undefined,
                        purpose: moveForm.purpose || "",
                        remarks: "",
                      }
                    }
                  });
                  setMStatus({ message: "Movement applied successfully!", type: 'success' });
                  setTimeout(() => {
                    setShowMovementModal(false);
                    setMStatus(null);
                    setMoveForm({ movement_date: new Date().toISOString().split('T')[0], movement_type: "official", out_time: "", in_time: "", purpose: "" });
                  }, 1500);
                } catch (err: unknown) {
                  const error = err as { message?: string };
                  setMStatus({ message: error.message || "Error applying", type: 'error' });
                }
              }}>{mLoading ? 'Submitting...' : 'Apply'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
