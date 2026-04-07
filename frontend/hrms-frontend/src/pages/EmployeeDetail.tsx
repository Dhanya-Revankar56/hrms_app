import { useState, useEffect, useMemo, useRef } from "react";
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
import { isAdmin, isHod } from "../utils/auth";
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
  .ed-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .ed-table th { text-align: left; padding: 14px 12px; font-size: 13.5px; font-weight: 700; color: #475569; border-bottom: 2px solid #f1f5f9; background: #f8fbff; white-space: nowrap; }
  .ed-table td { padding: 14px 12px; border-bottom: 1.5px solid #f1f5f9; font-size: 14.5px; color: #334155; vertical-align: middle; font-weight: 500; }
  
  .ed-att-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #fff; border-bottom: 2px solid #f1f5f9; }
  .ed-month-nav { display: flex; align-items: center; gap: 16px; font-size: 16px; font-weight: 700; color: #1e293b; }
  .ed-nav-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; transition: 0.2s; }
  .ed-nav-btn:hover { color: #1e293b; background: #f1f5f9; border-radius: 4px; }
  
  .ed-att-stats-box { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.4; }
  .ed-stat-row { font-size: 13.5px; font-weight: 700; color: #1e293b; }
  .ed-stat-lbl { color: #64748b; font-weight: 600; margin-right: 4px; }

  .ed-day-info { display: flex; flex-direction: column; gap: 2px; }
  .ed-day-date { font-weight: 700; color: #1e293b; font-size: 14px; }
  .ed-day-name { font-size: 12px; color: #94a3b8; font-weight: 500; }
  
  .ed-table-container { padding: 0 12px; }

  .ed-pill { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
  .ed-status-present { background: #f0fdf4; color: #16a34a; }
  .ed-status-absent { background: #fef2f2; color: #dc2626; }
  .ed-status-weekend { background: #fffbeb; color: #d97706; }
  .ed-status-pending { background: #fff7ed; color: #f59e0b; }
  
  .ed-day-info { display: flex; flex-direction: column; gap: 2px; }
  .ed-day-date { font-weight: 700; color: #1e293b; }
  .ed-day-name { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: capitalize; }
  
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
  .ed-leave-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .ed-leave-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .ed-leave-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -2px rgba(0,0,0,0.08); border-color: #3b82f6; }
  .ed-leave-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
  .ed-leave-info { flex: 1; min-width: 0; }
  .ed-leave-type { font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ed-leave-stats { font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 1px; }
  .ed-leave-used { font-size: 10px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 3px; }
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
  /* Modals */
  .ed-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: ed-fade-in 0.2s ease; }
  .ed-modal-card { background: #ffffff !important; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); padding: 24px; position: relative; z-index: 10000; color: #1e293b; }
  .ed-modal-field { margin-bottom: 16px; }
  .ed-modal-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .ed-modal-input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500; outline: none; background: #fff; color: #1e293b; }
  .ed-modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .ed-modal-select { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500; background: #fff; cursor: pointer; color: #1e293b; outline: none; }

  .ed-face-setup { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: #f8fafc; }
  .ed-face-label { font-size: 14px; color: #475569; font-weight: 600; }
  .ed-face-icons { display: flex; gap: 16px; color: #64748b; }
  
  .ed-template-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: block; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; }
  .ed-template-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
  .ed-template-table th { text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; border: none !important; background: transparent !important; padding: 0 4px !important; }
  .ed-template-table td { padding: 4px 4px; font-size: 13px; vertical-align: middle; border: none; }
  .ed-td-day { font-weight: 600; color: #475569; width: 100px; }
  .ed-td-time { font-weight: 600; color: #1e293b; text-align: center; background: #f1f5f9; border-radius: 6px; padding: 4px 10px !important; }
  .ed-td-action { text-align: right; color: #3b82f6; cursor: pointer; padding-left: 12px !important; position: relative; }
  
  .ed-action-dropdown {
    position: absolute;
    right: 12px;
    top: 40px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 1000;
    width: 170px;
    overflow: hidden;
    animation: ed-slide-down 0.2s ease-out;
  }
  .ed-action-item {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: 0.1s;
    text-align: left;
    width: 100%;
    background: none;
    border: none;
  }
  .ed-action-item:hover { background: #f8fafc; color: #1d4ed8; }
  .ed-action-item svg { color: #94a3b8; }
  .ed-action-item:hover svg { color: #3b82f6; }

  /* Details Modal */
  .ed-details-header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; }
  .ed-details-title { font-size: 18px; font-weight: 700; color: #1e293b; }
  .ed-details-section { margin-bottom: 24px; }
  .ed-details-sec-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px; }
  .ed-details-grid { display: flex; flex-direction: column; gap: 14px; }
  .ed-details-row { display: grid; grid-template-columns: 120px 80px 1fr; align-items: center; font-size: 14px; }
  .ed-details-label { font-weight: 600; color: #64748b; }
  .ed-details-time { font-weight: 700; color: #1e293b; text-align: center; }
  .ed-details-status { font-weight: 600; color: #94a3b8; padding-left: 20px; }
  .ed-details-punch-link { color: #3b82f6; font-size: 13.5px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
  .ed-details-punch-link:hover { text-decoration: underline; }

  /* Status Update Modal */
  .ed-status-modal-note { padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 20px; }
  .ed-status-modal-note span { font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; }
  .ed-status-modal-note p { font-size: 12px; font-weight: 500; color: #64748b; margin: 0; line-height: 1.5; }

  /* Update Shift Modal */
  .ed-modal-card.wide { max-width: 900px; width: 95%; }
  .ed-timing-grid { width: 100%; margin-top: 10px; }
  .ed-t-header { display: grid; grid-template-columns: 140px 1fr 1fr 1fr 40px; gap: 20px; padding: 12px 0; border-bottom: 1.5px solid #f1f5f9; text-align: center; }
  .ed-t-header span { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .ed-t-row { display: grid; grid-template-columns: 140px 1fr 1fr 1fr 40px; gap: 20px; align-items: center; padding: 16px 0; }
  .ed-t-label { font-size: 14px; font-weight: 600; color: #475569; }
  .ed-t-input-group { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 10px; transition: 0.2s; }
  .ed-t-input-group:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .ed-t-input { width: 100%; border: none; padding: 10px 0; outline: none; font-size: 15px; font-weight: 600; color: #1e293b; background: transparent; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif; letter-spacing: -0.01em; }
  .ed-t-icon { color: #94a3b8; margin-left: 8px; }
  
  .ed-t-trash { background: none; border: none; color: #f87171; cursor: pointer; padding: 6px; display: flex; align-items: center; transition: 0.2s; border-radius: 6px; }
  .ed-t-trash:hover { background: #fef2f2; }

  @keyframes ed-fade-in { from { opacity: 0; } to { opacity: 1; } }
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
  marked_by?: string;
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

interface SessionTiming {
  label?: string;
  before: string;
  marking: string;
  after: string;
  isOptional: boolean;
  before_display?: string;
  after_display?: string;
  marking_display?: string;
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

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    const d = new Date(date);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      iso,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
      dateLabel: `${d.getDate()} ${d.toLocaleDateString("en-US", { month: 'short' })} ${d.getFullYear()}`
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activeTab, setActiveTab] = useState<TabType>("Summary");

  const [yearNum, monthNum] = useMemo(() => monthYear.split("-").map(Number), [monthYear]);
  const daysInMonth = useMemo(() => getDaysInMonth(yearNum, monthNum - 1), [yearNum, monthNum]);

  const { data: empData, loading: empLoading } = useQuery<{ employee: Employee }>(GET_EMPLOYEE_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only'
  });

  const { data: settingsData } = useQuery<{ settings: Settings }>(GET_SETTINGS);
  const leaveTypes = useMemo(() => settingsData?.settings?.leave_types || [], [settingsData]);

  const { data: salaryData } = useQuery<{ salaryRecord: SalaryRecord }>(GET_SALARY_RECORD, {
    variables: { employee_id: id },
    skip: activeTab !== "Salary Details" && activeTab !== "Summary",
  });

  const { data: attendanceData } = useQuery<{ attendances: { items: Attendance[] } }>(GET_ATTENDANCES, {
    variables: { 
      employee_id: id,
      from_date: daysInMonth[0].iso,
      to_date: daysInMonth[daysInMonth.length - 1].iso
    },
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

  const initialDefaultDone = useRef(false);
  useEffect(() => {
    if (leaveTypes.length > 0 && !applyForm.leave_type && !initialDefaultDone.current) {
      initialDefaultDone.current = true;
      setTimeout(() => {
        setApplyForm(prev => ({ ...prev, leave_type: leaveTypes[0].name }));
      }, 0);
    }
  }, [leaveTypes, applyForm.leave_type]);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showRet, setShowRet] = useState(false);
  const [mStatus, setMStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAttSettingsModal, setShowAttSettingsModal] = useState(false);
  const [biometricId, setBiometricId] = useState("200");
  const [selectedShift, setSelectedShift] = useState("Teaching Staff");
  const [template, setTemplate] = useState([
    { day: "Sunday", checkin: "", checkout: "", isWeekOff: true },
    { day: "Monday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Tuesday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Wednesday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Thursday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Friday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Saturday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
  ]);

  const formatTo12Hr = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };
  const [showDetailEditModal, setShowDetailEditModal] = useState(false);
  const [showAttendanceDetailsModal, setShowAttendanceDetailsModal] = useState(false);
  const [selectedDetailsDate, setSelectedDetailsDate] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [updateStatusValue, setUpdateStatusValue] = useState("PRESENT");
  const [showUpdateShiftTimeModal, setShowUpdateShiftTimeModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState("Check In");
  const [updateReason, setUpdateReason] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Handle dropdown close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [selectedDayName, setSelectedDayName] = useState("");
  const [detailTimingData, setDetailTimingData] = useState<SessionTiming[]>([
    { label: "Check In", before: "08:30", marking: "08:55", after: "09:30", isOptional: false },
    { label: "Intermediate 1", before: "12:30", marking: "12:30", after: "13:00", isOptional: true },
    { label: "Intermediate 2", before: "14:15", marking: "14:25", after: "15:00", isOptional: true },
    { label: "Check Out", before: "17:00", marking: "17:30", after: "17:45", isOptional: false },
  ]);
  const [moveForm, setMoveForm] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    movement_type: "official",
    out_time: "09:00",
    in_time: "10:00",
    purpose: "",
    remarks: ""
  });

  const [applyMovement, { loading: mLoading }] = useMutation(CREATE_MOVEMENT, {
    refetchQueries: [{ query: GET_MOVEMENTS, variables: { employee_id: id } }]
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
          <div className="ed-section" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ed-att-toolbar">
              <div className="ed-month-nav">
                <button className="ed-nav-btn" onClick={() => {
                  const d = new Date(monthYear + "-01");
                  d.setMonth(d.getMonth() - 1);
                  setMonthYear(d.toISOString().slice(0, 7));
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span>{new Date(monthYear + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button className="ed-nav-btn" onClick={() => {
                  const d = new Date(monthYear + "-01");
                  d.setMonth(d.getMonth() + 1);
                  setMonthYear(d.toISOString().slice(0, 7));
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              
              <div className="ed-att-stats-box">
                <div className="ed-stat-row">
                  <span className="ed-stat-lbl">Total Late Mins :</span> 0
                </div>
                <div className="ed-stat-row">
                  <span className="ed-stat-lbl">Balance Late Mins :</span> 100
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {(isAdmin() || isHod()) && (
                  <>
                    <button className="ed-btn" title="History" onClick={() => {
                      if (selectedDates.length === 0) {
                        alert("Please select at least one date to update.");
                        return;
                      }
                      setShowUpdateShiftTimeModal(true);
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </button>
                    <button className="ed-btn" title="Edit Record" onClick={() => {
                      if (selectedDates.length === 0) {
                        alert("Please select at least one date to update.");
                        return;
                      }
                      setShowUpdateStatusModal(true);
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </>
                )}
                <button className="ed-btn" title="Download"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>
                {(isAdmin() || isHod()) && (
                  <button className="ed-btn" title="Settings" onClick={() => setShowAttSettingsModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="ed-table-container" style={{ overflowX: 'auto' }}>
              <table className="ed-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDates.length === daysInMonth.length && daysInMonth.length > 0}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = selectedDates.length > 0 && selectedDates.length < daysInMonth.length;
                          }
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDates(daysInMonth.map(d => d.iso));
                          } else {
                            setSelectedDates([]);
                          }
                        }}
                      />
                    </th>
                    <th style={{ width: 180 }}>Date</th>
                    <th style={{ width: 160 }}>Check in</th>
                    <th style={{ width: 120 }}>I</th>
                    <th style={{ width: 140 }}>II</th>
                    <th style={{ width: 160 }}>Check out</th>
                    <th style={{ width: 180 }}>Last updated by</th>
                    <th style={{ width: 140, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daysInMonth].reverse().map((day) => {
                    const record = attendanceData?.attendances?.items?.find(r => r.date === day.iso);
                    const isWeekend = day.dayName === 'Sunday';
                    
                    let statusLabel = record?.status || "NOT MARKED";
                    let statusClass = "ed-status-pending";

                    if (isWeekend) {
                      statusLabel = "WEEK_OFF";
                      statusClass = "ed-status-weekend";
                    } else if (!record) {
                      statusLabel = "ABSENT";
                      statusClass = "ed-status-absent";
                    } else if (record.status?.toLowerCase() === 'present') {
                      statusLabel = "PRESENT";
                      statusClass = "ed-status-present";
                    } else if (record.status?.toLowerCase() === 'absent') {
                      statusLabel = "ABSENT";
                      statusClass = "ed-status-absent";
                    }

                    return (
                      <tr key={day.iso}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedDates.includes(day.iso)}
                            onChange={() => {
                              if (selectedDates.includes(day.iso)) {
                                setSelectedDates(selectedDates.filter(d => d !== day.iso));
                              } else {
                                setSelectedDates([...selectedDates, day.iso]);
                              }
                            }}
                          />
                        </td>
                        <td>
                          <div className="ed-day-info">
                            <span className="ed-day-date">{day.dateLabel}</span>
                            <span className="ed-day-name">{day.dayName}</span>
                          </div>
                        </td>
                        <td>{record?.check_in ? to12(record.check_in) : (isWeekend ? "Week Off" : "-")}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>{record?.check_out ? to12(record.check_out) : (isWeekend ? "Week Off" : "-")}</td>
                        <td>{record?.marked_by || "-"}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`ed-pill ${statusClass}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedDetailsDate(day.iso);
                              setShowAttendanceDetailsModal(true);
                            }}
                          >{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                    <th style={{ textAlign: 'center' }}>Status</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <span className={`ed-pill ed-status-${(m.status || 'pending').toLowerCase()}`}>
                          {m.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!movementsData?.movements?.items || movementsData.movements.items.length === 0) && (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: 30, color: '#94a3b8'}}>No movement records found.</td></tr>
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
                    <td>
                      <span className="ed-pill" style={{
                        background: (l.approvals?.find((a) => a.role === 'HEAD OF DEPARTMENT')?.status === 'approved' ? '#dcfce7' : l.approvals?.find((a) => a.role === 'HEAD OF DEPARTMENT')?.status === 'rejected' ? '#fee2e2' : '#fef9c3'),
                        color: (l.approvals?.find((a) => a.role === 'HEAD OF DEPARTMENT')?.status === 'approved' ? '#166534' : l.approvals?.find((a) => a.role === 'HEAD OF DEPARTMENT')?.status === 'rejected' ? '#991b1b' : '#854d0e')
                      }}>
                        {l.approvals?.find((a) => a.role === 'HEAD OF DEPARTMENT')?.status || 'pending'}
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
                              leave_type: applyForm.leave_type,
                              from_date: newFrom,
                              to_date: newTo,
                              reason: applyForm.reason,
                              is_half_day: applyForm.is_half_day,
                              half_day_type: applyForm.half_day_type,
                              employee_id: id || "",
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
            <h2 className="ed-sec-title">Uploaded Documents</h2>
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
                    <option value="Exam Duty">Exam Duty</option>
                    <option value="Bank Visit">Bank Visit</option>
                    <option value="Medical Appointment">Medical Appointment</option>
                    <option value="Outside Meeting">Outside Meeting</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                    <option value="Official Field Work">Official Field Work</option>
                    <option value="Government Office">Government Office</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Purpose <span style={{color:'red'}}>*</span></label>
                  <textarea className="ed-select" style={{height: 60, padding: 10, resize: 'none'}} value={moveForm.purpose} onChange={e => setMoveForm({...moveForm, purpose: e.target.value})} placeholder="Describe the reason for movement..."></textarea>
                </div>
                <div className="ed-filter-item">
                  <label className="ed-filter-label">Remarks</label>
                  <textarea className="ed-select" style={{height: 60, padding: 10, resize: 'none'}} value={moveForm.remarks} onChange={e => setMoveForm({...moveForm, remarks: e.target.value})} placeholder="Additional notes..."></textarea>
                </div>
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
                        employee_code: employee?.employee_id || "",
                        movement_date: moveForm.movement_date,
                        movement_type: moveForm.movement_type,
                        out_time: moveForm.out_time,
                        in_time: moveForm.in_time || null,
                        purpose: moveForm.purpose,
                        remarks: moveForm.remarks
                      }
                    }
                  });
                  setMStatus({ message: "Movement applied successfully!", type: 'success' });
                  setTimeout(() => {
                    setShowMovementModal(false);
                    setMStatus(null);
                    setMoveForm({ 
                      movement_date: new Date().toISOString().split('T')[0], 
                      movement_type: "official", 
                      out_time: "09:00", 
                      in_time: "10:00", 
                      purpose: "", 
                      remarks: "" 
                    });
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
      {showAttSettingsModal && (
        <div className="ed-modal-overlay" onClick={() => setShowAttSettingsModal(false)}>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>

            <div className="ed-template-details">
              <span className="ed-template-title">Template Details</span>
              <table className="ed-template-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th style={{ textAlign: 'center' }}>Checkin - Checkout</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {template.map((row, idx) => {
                    const isEditing = false;
                    return (
                      <tr key={row.day}>
                        <td className="ed-td-day">{row.day}</td>
                        <td className="ed-td-time">
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={row.isWeekOff} 
                                onChange={(e) => {
                                  const newT = [...template];
                                  newT[idx].isWeekOff = e.target.checked;
                                  setTemplate(newT);
                                }}
                                title="Week Off"
                              />
                              {!row.isWeekOff && (
                                <>
                                  <input 
                                    type="time" 
                                    className="ed-modal-input" 
                                    style={{ padding: '4px 8px', fontSize: '12px', width: 90 }}
                                    value={row.checkin}
                                    onChange={(e) => {
                                      const newT = [...template];
                                      newT[idx].checkin = e.target.value;
                                      setTemplate(newT);
                                    }}
                                  />
                                  <span>-</span>
                                  <input 
                                    type="time" 
                                    className="ed-modal-input" 
                                    style={{ padding: '4px 8px', fontSize: '12px', width: 90 }}
                                    value={row.checkout}
                                    onChange={(e) => {
                                      const newT = [...template];
                                      newT[idx].checkout = e.target.value;
                                      setTemplate(newT);
                                    }}
                                  />
                                </>
                              )}
                              {row.isWeekOff && <span style={{ color: '#94a3b8', fontSize: '13px' }}>Week Off</span>}
                            </div>
                          ) : (
                            row.isWeekOff ? "Week Off" : `${formatTo12Hr(row.checkin)} - ${formatTo12Hr(row.checkout)}`
                          )}
                        </td>
                        <td className="ed-td-action">
                          <button 
                            onClick={() => {
                              setSelectedDayName(row.day);
                              setShowDetailEditModal(true);
                            }}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="ed-btn" style={{ flex: 1, justifyContent: 'center', height: 44 }} onClick={() => setShowAttSettingsModal(false)}>Cancel</button>
              <button className="ed-btn" style={{ flex: 1, justifyContent: 'center', height: 44, background: '#00264d', color: '#fff' }}>Update</button>
            </div>
          </div>
        </div>
      )}
      {showDetailEditModal && (
        <div className="ed-modal-overlay" style={{ zIndex: 11000 }}>
          <div className="ed-modal-card wide">
            <span className="ed-template-title" style={{ fontSize: '18px', border: 'none' }}>Update Shift - {selectedDayName}</span>
            
            <div className="ed-timing-grid">
              <div className="ed-t-header">
                <div></div>
                <span>Leisure before</span>
                <span>Marking time</span>
                <span>Leisure after</span>
                <div></div>
              </div>
              
              {detailTimingData.map((session, idx) => (
                <div className="ed-t-row" key={idx}>
                  <div className="ed-t-label">{session.label}</div>
                  <div className="ed-t-input-group">
                    <input type="text" className="ed-t-input" value={formatTo12Hr(session.before)} onChange={(e) => {
                      // Basic parsing: if user types "01:30 PM" -> "13:30"
                      // For now, let's keep it simple and just allow editing in a text field
                      // Realistically, for a professional UI, we might want a better picker, 
                      // but here we respond to the '12 hours cycle' request.
                      const newVal = e.target.value;
                      const newD = [...detailTimingData];
                      newD[idx].before_display = newVal; // Temporary state for raw input if needed
                      // For simplicity, we'll try to parse or just store the 24h equivalent logic
                      setDetailTimingData(newD);
                    }} onBlur={(e) => {
                      // On blur, attempt to convert back to HH:mm for internal state
                      const val = e.target.value;
                      const matched = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                      if (matched) {
                        let h = parseInt(matched[1]);
                        const m = matched[2];
                        const ap = matched[3].toUpperCase();
                        if (ap === 'PM' && h < 12) h += 12;
                        if (ap === 'AM' && h === 12) h = 0;
                        const newD = [...detailTimingData];
                        newD[idx].before = `${h.toString().padStart(2, '0')}:${m}`;
                        setDetailTimingData(newD);
                      }
                    }}/>
                    <svg className="ed-t-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="ed-t-input-group">
                    <input type="text" className="ed-t-input" value={formatTo12Hr(session.marking)} onChange={(e) => {
                       const newD = [...detailTimingData];
                       newD[idx].marking_display = e.target.value;
                       setDetailTimingData(newD);
                    }} onBlur={(e) => {
                      const val = e.target.value;
                      const matched = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                      if (matched) {
                        let h = parseInt(matched[1]);
                        const m = matched[2];
                        const ap = matched[3].toUpperCase();
                        if (ap === 'PM' && h < 12) h += 12;
                        if (ap === 'AM' && h === 12) h = 0;
                        const newD = [...detailTimingData];
                        newD[idx].marking = `${h.toString().padStart(2, '0')}:${m}`;
                        setDetailTimingData(newD);
                      }
                    }}/>
                    <svg className="ed-t-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="ed-t-input-group">
                    <input type="text" className="ed-t-input" value={formatTo12Hr(session.after)} onChange={(e) => {
                       const newD = [...detailTimingData];
                       newD[idx].after_display = e.target.value;
                       setDetailTimingData(newD);
                    }} onBlur={(e) => {
                      const val = e.target.value;
                      const matched = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                      if (matched) {
                        let h = parseInt(matched[1]);
                        const m = matched[2];
                        const ap = matched[3].toUpperCase();
                        if (ap === 'PM' && h < 12) h += 12;
                        if (ap === 'AM' && h === 12) h = 0;
                        const newD = [...detailTimingData];
                        newD[idx].after = `${h.toString().padStart(2, '0')}:${m}`;
                        setDetailTimingData(newD);
                      }
                    }}/>
                    <svg className="ed-t-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    {session.isOptional && (
                      <button className="ed-t-trash" onClick={() => {
                        const newD = detailTimingData.filter((_, i) => i !== idx);
                        setDetailTimingData(newD);
                      }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <input 
                type="checkbox" 
                id="applyAllDays" 
                style={{ cursor: 'pointer' }} 
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <label htmlFor="applyAllDays" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer' }}>Apply to all days</label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end' }}>
              <button className="ed-btn" style={{ width: 120, justifyContent: 'center' }} onClick={() => setShowDetailEditModal(false)}>Cancel</button>
              <button className="ed-btn" style={{ width: 120, justifyContent: 'center', background: '#00264d', color: '#fff' }} onClick={() => {
                const newTemplate = [...template];
                const checkInRow = detailTimingData.find(d => d.label === "Check In");
                const checkOutRow = detailTimingData.find(d => d.label === "Check Out");

                if (applyToAll) {
                  newTemplate.forEach(t => {
                    if (!t.isWeekOff) {
                      if (checkInRow) t.checkin = checkInRow.marking;
                      if (checkOutRow) t.checkout = checkOutRow.marking;
                    }
                  });
                } else {
                  const dayIdx = newTemplate.findIndex(t => t.day === selectedDayName);
                  if (dayIdx > -1) {
                    if (checkInRow) newTemplate[dayIdx].checkin = checkInRow.marking;
                    if (checkOutRow) newTemplate[dayIdx].checkout = checkOutRow.marking;
                    setTemplate(newTemplate);
                  }
                }
                setTemplate(newTemplate);
                setShowDetailEditModal(false);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {showAttendanceDetailsModal && (
        <div className="ed-modal-overlay" onClick={() => setShowAttendanceDetailsModal(false)}>
          <div className="ed-modal-card" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            <div className="ed-details-header">
              <div className="ed-details-title">Attendance Details of {selectedDetailsDate ? formatDateForDisplay(selectedDetailsDate) : ""}</div>
            </div>
            
            <div className="ed-details-section">
              <div className="ed-details-sec-title">Session Details</div>
              <div className="ed-details-grid">
                <div className="ed-details-row">
                  <span className="ed-details-label">Check in</span>
                  <span className="ed-details-time">-</span>
                  <span className="ed-details-status">To be marked</span>
                </div>
                <div className="ed-details-row">
                  <span className="ed-details-label">II</span>
                  <span className="ed-details-time">-</span>
                  <span className="ed-details-status">To be marked</span>
                </div>
                <div className="ed-details-row">
                  <span className="ed-details-label">III</span>
                  <span className="ed-details-time">-</span>
                  <span className="ed-details-status">To be marked</span>
                </div>
                <div className="ed-details-row">
                  <span className="ed-details-label">Check out</span>
                  <span className="ed-details-time">-</span>
                  <span className="ed-details-status">To be marked</span>
                </div>
              </div>
            </div>
            
            <div className="ed-details-punch-link">View Punch Details</div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <button className="ed-btn" style={{ minWidth: 100, justifyContent: 'center' }} onClick={() => setShowAttendanceDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showUpdateStatusModal && (
        <div className="ed-modal-overlay" onClick={() => setShowUpdateStatusModal(false)}>
          <div className="ed-modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <div className="ed-details-header" style={{ marginBottom: 20 }}>
              <div className="ed-details-title">Update Attendance Status</div>
            </div>
            
            <div className="ed-modal-body" style={{ padding: 0 }}>
              <div className="ed-modal-field" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: 20 }}>
                <label className="ed-modal-label" style={{ marginBottom: 0 }}>Status</label>
                <select 
                  className="ed-modal-select" 
                  value={updateStatusValue} 
                  onChange={(e) => setUpdateStatusValue(e.target.value)}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="WEEK_OFF">Week Off</option>
                </select>
              </div>

              <div className="ed-status-modal-note">
                <span>Note:</span>
                <p>This model updates data in batches, so it may not reflect the latest information immediately. Please wait for a few minutes or check back later for the updated results.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
              <button className="ed-btn" style={{ minWidth: 100, justifyContent: 'center' }} onClick={() => setShowUpdateStatusModal(false)}>Cancel</button>
              <button className="ed-btn" style={{ minWidth: 100, justifyContent: 'center', background: '#00264d', color: '#fff' }} onClick={() => {
                // Here we would trigger the mutation
                // For UI demo, we'll just close it
                setShowUpdateStatusModal(false);
                setSelectedDates([]);
              }}>Update</button>
            </div>
          </div>
        </div>
      )}
      {showUpdateShiftTimeModal && (
        <div className="ed-modal-overlay" onClick={() => setShowUpdateShiftTimeModal(false)}>
          <div className="ed-modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <div className="ed-details-header" style={{ marginBottom: 20 }}>
              <div className="ed-details-title">Update Shift Time</div>
            </div>
            
            <div className="ed-modal-body" style={{ padding: 0 }}>
              <div className="ed-modal-field" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: 20 }}>
                <label className="ed-modal-label" style={{ marginBottom: 0 }}>Session</label>
                <select 
                  className="ed-modal-select" 
                  value={selectedSession} 
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="Check In">Check In</option>
                  <option value="Intermediate 1">Intermediate 1</option>
                  <option value="Intermediate 2">Intermediate 2</option>
                  <option value="Check Out">Check Out</option>
                </select>
              </div>

              <div className="ed-modal-field" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'flex-start', gap: 20 }}>
                <label className="ed-modal-label" style={{ marginTop: 12 }}>Reason</label>
                <textarea 
                  className="ed-modal-input" 
                  style={{ height: 60, padding: 10, resize: 'none' }} 
                  value={updateReason} 
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="Reason for change..."
                ></textarea>
              </div>

              <div className="ed-status-modal-note">
                <span>Note:</span>
                <p>This model updates data in batches, so it may not reflect the latest information immediately. Please wait for a few minutes or check back later for the updated results.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
              <button className="ed-btn" style={{ minWidth: 100, justifyContent: 'center' }} onClick={() => setShowUpdateShiftTimeModal(false)}>Cancel</button>
              <button className="ed-btn" style={{ minWidth: 100, justifyContent: 'center', background: '#00264d', color: '#fff' }} onClick={() => {
                // Here we would trigger the mutation
                setShowUpdateShiftTimeModal(false);
                setSelectedDates([]);
              }}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
