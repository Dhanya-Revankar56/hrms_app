import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_RELIEVINGS,
  CREATE_RELIEVING,
  UPDATE_RELIEVING,
} from "../graphql/relievingQueries";
import { GET_EMPLOYEES, REHIRE_EMPLOYEE } from "../graphql/employeeQueries";
import { GET_DASHBOARD_STATS } from "../graphql/settingsQueries";
import { GET_LEAVES } from "../graphql/leaveQueries";
import { GET_MOVEMENTS } from "../graphql/movementQueries";
import { isAdmin, isHod } from "../utils/auth";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type ExitStatus =
  | "Pending Approval"
  | "Approved"
  | "Clearance In Progress"
  | "Relieved"
  | "Rejected";

type ClearanceStatus = "Pending" | "Approved";

type ExitReason =
  | "Personal Reasons"
  | "Better Opportunity"
  | "Higher Studies"
  | "Health Issues"
  | "Relocation"
  | "Family Reasons"
  | "Retirement"
  | "Other";

type SortField =
  | "name"
  | "empId"
  | "department"
  | "resignDate"
  | "lastDay"
  | "status";
type SortDir = "asc" | "desc";

interface Clearance {
  dept: string;
  status: ClearanceStatus;
  remarks: string;
  clearedBy: string;
  clearedOn: string;
}

interface Settlement {
  salarySettled: boolean;
  pfSettled: boolean;
  gratuitySettled: boolean;
  expenseSettled: boolean;
  noDuesIssued: boolean;
  experienceLetterIssued: boolean;
}

interface RelievingEmployee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  name?: string;
  reporting_to_employee?: {
    first_name: string;
    last_name: string;
  };
  work_detail?: {
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
}

interface BackendRelieving {
  id: string;
  employee_id: string;
  employee_code: string;
  resignation_date: string;
  last_working_date: string;
  notice_period_days: number;
  reason: string;
  status: ExitStatus;
  exit_interview_done?: boolean;
  assets_returned?: boolean;
  relieve_letter_path?: string;
  remarks?: string;
  created_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    user_email?: string;
    user_contact?: string;
    work_detail?: {
      department?: { id: string; name: string };
      designation?: { id: string; name: string };
      date_of_joining?: string;
      reporting_to?: string;
    };
  };
}

interface RelievingData {
  relievings: {
    items: BackendRelieving[];
    pageInfo: { totalCount: number; totalPages: number };
  };
}

interface ExitRecord {
  id: string;
  empId: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  avatarColor: string;
  officialEmail: string;
  phone: string;
  reportingManager: string;
  joiningDate: string;
  resignDate: string;
  lastWorkingDay: string;
  noticePeriod: number;
  exitReason: ExitReason;
  exitReasonDetail: string;
  status: ExitStatus;
  appliedDate: string;
  approvedBy: string;
  approvedOn: string;
  hrRemarks: string;
  clearances: Clearance[];
  settlement: Settlement;
  exitInterviewDone: boolean;
  exitInterviewNotes: string;
  employeeDbId: string;
}

interface FilterState {
  search: string;
  department: string;
  status: ExitStatus | "All";
  dateFrom: string;
}

interface FormState {
  empId: string;
  resignDate: string;
  lastWorkingDay: string;
  exitReason: ExitReason;
  exitReasonDetail: string;
  reportingManager: string;
}

interface FormErrors {
  empId?: string;
  resignDate?: string;
  lastWorkingDay?: string;
  exitReason?: string;
  exitReasonDetail?: string;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const DEPARTMENTS: string[] = [
  "All",
  "Computer Science And Engineering",
  "Data Science",
  "Aiml",
  "Information science",
  "Library",
  "Administration",
];

const EXIT_REASONS: ExitReason[] = [
  "Personal Reasons",
  "Better Opportunity",
  "Higher Studies",
  "Health Issues",
  "Relocation",
  "Family Reasons",
  "Retirement",
  "Other",
];

// let nextId = ... (Removed legacy mock id manager)

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatDate(ts: string | number | Date | null | undefined): string {
  if (!ts) return "—";
  const d = isNaN(Number(ts)) ? new Date(ts) : new Date(Number(ts));
  if (isNaN(d.getTime())) return String(ts);

  const day = d.getDate();
  const m = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = m[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function calcNoticeDays(resign: string, last: string): number {
  if (!resign || !last) return 0;
  const diff = new Date(last).getTime() - new Date(resign).getTime();
  return diff < 0 ? 0 : Math.round(diff / 86400000);
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Page ── */
  .er-page { font-family:'DM Sans',sans-serif; }
  .er-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; }
  .er-title  { font-family:'DM Sans',sans-serif; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.5px; }
  .er-sub    { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#64748b; margin-top:4px; }
  .er-header-actions { display:flex; gap:10px; align-items:center; }
  .er-header-btn {
    height:38px; padding:0 16px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer;
    display:inline-flex; align-items:center; gap:7px; color:#334155; transition:all 0.13s; white-space:nowrap;
  }
  .er-header-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }
  .er-header-btn-primary { background:#1d4ed8; color:#fff; border-color:#1d4ed8; box-shadow:0 2px 8px rgba(29,78,216,.22); }
  .er-header-btn-primary:hover { background:#1e40af; border-color:#1e40af; }

  /* ── Stats ── */
  .er-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:20px; }
  .er-stat-card {
    background:#fff; border:1px solid #e2e8f0; border-radius:12px;
    padding:15px 17px; box-shadow:0 1px 3px rgba(15,23,42,.05);
    display:flex; align-items:center; gap:13px; transition:box-shadow .14s, transform .14s;
  }
  .er-stat-card:hover { box-shadow:0 6px 18px rgba(15,23,42,.09); transform:translateY(-1px); }
  .er-stat-icon { width:42px; height:42px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .er-stat-val  { font-family:'Inter',sans-serif; font-size:26px; font-weight:700; letter-spacing:-1px; line-height:1; font-variant-numeric:tabular-nums; }
  .er-stat-lbl  { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#64748b; margin-top:3px; }
  .er-stat-sub  { font-family:'DM Sans',sans-serif; font-size:10.5px; color:#94a3b8; margin-top:2px; }

  /* ── Section Card ── */
  .er-section {
    background:#fff; border:1px solid #e2e8f0; border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,.05),0 4px 12px rgba(15,23,42,.04);
    overflow:visible; margin-bottom:20px;
  }

  /* ── Collapsible Form ── */
  .er-form-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 22px; cursor:pointer; user-select:none;
    border-bottom:1px solid transparent; transition:border-color 0.14s;
  }
  .er-form-header.open { border-color:#f1f5f9; }
  .er-form-header-left { display:flex; align-items:center; gap:10px; }
  .er-form-icon { width:34px; height:34px; border-radius:9px; background:#fff0f0; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .er-form-title { font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; color:#0f172a; }
  .er-form-sub   { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:#94a3b8; margin-top:1px; }
  .er-form-chevron { color:#94a3b8; transition:transform 0.2s; }
  .er-form-chevron.open { transform:rotate(180deg); }
  .er-form-body   { padding:0 22px 22px; }
  .er-form-grid   { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .er-form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }
  .er-form-full   { margin-bottom:14px; }
  .er-label { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px; display:block; }
  .er-req   { color:#dc2626; margin-left:2px; }
  .er-input, .er-select, .er-textarea {
    width:100%; height:36px; padding:0 12px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; transition:border-color 0.14s, box-shadow 0.14s;
    -webkit-appearance:none; appearance:none;
  }
  .er-select {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center;
    padding-right:30px; cursor:pointer;
  }
  .er-textarea { height:72px; padding:9px 12px; resize:none; }
  .er-input:focus,.er-select:focus,.er-textarea:focus {
    border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09);
  }
  .er-input-error { border-color:#dc2626 !important; }
  .er-error-msg   { font-family:'DM Sans',sans-serif; font-size:11px; color:#dc2626; margin-top:4px; font-weight:500; }
  .er-days-badge  {
    display:inline-flex; align-items:center; gap:5px;
    padding:0 12px; height:36px; border-radius:8px; background:#eff6ff;
    border:1px solid #bfdbfe; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; color:#1d4ed8;
    font-variant-numeric:tabular-nums;
  }
  .er-form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
  .er-btn {
    height:38px; padding:0 20px; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 0.13s;
  }
  .er-btn-primary { background:#dc2626; color:#fff; border:none; box-shadow:0 2px 8px rgba(220,38,38,.25); }
  .er-btn-primary:hover { background:#b91c1c; }
  .er-btn-outline { background:#fff; color:#64748b; border:1.5px solid #e2e8f0; }
  .er-btn-outline:hover { background:#f1f5f9; color:#0f172a; }

  /* ── Filter Bar ── */
  .er-filter-bar {
    display:flex; align-items:center; flex-wrap:nowrap;
    gap:8px; padding:13px 18px; border-bottom:1px solid #f1f5f9;
  }
  .er-search-wrap { position:relative; flex:0 0 200px; }
  .er-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
  .er-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; transition:border-color 0.14s;
  }
  .er-search::placeholder { color:#94a3b8; }
  .er-search:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09); }
  .er-filter-sel, .er-filter-date {
    height:36px; padding:0 26px 0 10px; border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#334155; background:#f8fafc;
    outline:none; cursor:pointer; flex-shrink:0;
    -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 9px center;
    transition:border-color 0.14s;
  }
  .er-filter-date { padding:0 10px; cursor:text; background-image:none; width:130px; }
  .er-filter-sel:focus,.er-filter-date:focus { border-color:#1d4ed8; outline:none; }
  .er-filter-divider { width:1px; height:22px; background:#e2e8f0; flex-shrink:0; }
  .er-filter-count   { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#64748b; white-space:nowrap; margin-left:auto; flex-shrink:0; }

  /* ── Table ── */
  .er-table-wrap { overflow-x:auto; } /* Removed min-height to reduce extra space below list */
  table.er-table { width:100%; border-collapse:collapse; }
  .er-table thead tr { background:#f8fafc; border-bottom:1.5px solid #e8edf5; }
  .er-table th {
    padding:10px 13px; text-align:left;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#64748b;
    letter-spacing:0.07em; text-transform:uppercase; white-space:nowrap;
    cursor:pointer; user-select:none;
  }
  .er-table th:hover { color:#1d4ed8; }
  .er-table th.er-sorted { color:#1d4ed8; }
  .er-th-inner { display:flex; align-items:center; gap:5px; }
  .er-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background 0.1s; position:relative; }
  .er-table tbody tr:last-child { border-bottom:none; }
  .er-table tbody tr:hover { background:#fafbfe; z-index:5; }
  .er-table tbody tr:focus-within { z-index:100; } /* Ensure row with active menu is on top */
  .er-table td { padding:11px 13px; vertical-align:middle; }

  /* ── Emp ID cell — Inter monospace ── */
  .er-emp-id {
    font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
    color:#94a3b8; font-variant-numeric:tabular-nums; white-space:nowrap;
  }

  /* ── Employee name cell ── */
  .er-emp-cell { display:flex; align-items:center; gap:10px; }
  .er-emp-av   { width:33px; height:33px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; color:#fff; }
  .er-emp-name { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:#0f172a; line-height:1.2; white-space:nowrap; }
  .er-emp-sub  { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; color:#94a3b8; margin-top:1px; }

  /* ── Dept pill ── */
  .er-dept-pill { display:inline-block; padding:3px 10px; border-radius:99px; background:#eff6ff; color:#1d4ed8; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; }

  /* ── Date cell — Inter ── */
  .er-date-val {
    font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#334155;
    font-variant-numeric:tabular-nums; white-space:nowrap;
  }

  /* ── Notice period ── */
  .er-notice-badge {
    display:inline-block; padding:2px 8px; border-radius:6px;
    background:#f1f5f9; color:#475569;
    font-family:'Inter',sans-serif; font-size:12px; font-weight:600;
    font-variant-numeric:tabular-nums;
  }

  /* ── Designation text ── */
  .er-desig { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#334155; white-space:nowrap; }

  /* ── Status Badges ── */
  .er-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:99px;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; white-space:nowrap;
  }
  .er-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; opacity:.7; }
  .er-badge-pending   { background:#fffbeb; color:#b45309; }
  .er-badge-approved  { background:#f0fdf4; color:#15803d; }
  .er-badge-clearance { background:#eff6ff; color:#1d4ed8; }
  .er-badge-relieved  { background:#f0fdf4; color:#059669; }
  .er-badge-rejected  { background:#fef2f2; color:#dc2626; }

  /* ── 3-dot Action Menu ── */
  .er-dots-wrap { position:relative; display:inline-flex; justify-content:center; perspective:1000px; }
  .er-dots-btn {
    width:30px; height:30px; border-radius:7px; border:1px solid #e2e8f0; background:#f8fafc;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; transition:all .13s; padding:0;
  }
  .er-dots-btn:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0f172a; }
  .er-dots-menu {
    position:absolute; top:50%; right:calc(100% + 8px); transform:translateY(-50%); z-index:2000;
    background:#fff; border:1px solid #e2e8f0; border-radius:12px;
    box-shadow:0 12px 32px rgba(15,23,42,.18), 0 4px 12px rgba(15,23,42,.08);
    min-width:180px; overflow:visible;
    animation:erMenuInRel .15s cubic-bezier(0.16, 1, 0.3, 1) both;
    display:flex; flex-direction:column;
    pointer-events:auto;
  }
  @keyframes erMenuInRel { from{opacity:0;transform:translateY(-50%) translateX(8px) scale(0.95)} to{opacity:1;transform:translateY(-50%) translateX(0) scale(1)} }
  @keyframes erMenuIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  .er-dots-item {
    padding:11px 16px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; color:#334155;
    cursor:pointer; transition:background .1s; white-space:nowrap;
    background:none; border:none; width:100%; text-align:left;
    display:flex; align-items:center; gap:10px;
  }
  .er-dots-item:hover { background:#f8fafc; }
  .er-dots-item.approve { color:#15803d; }
  .er-dots-item.approve:hover { background:#f0fdf4; }
  .er-dots-item.reject  { color:#dc2626; }
  .er-dots-item.reject:hover  { background:#fef2f2; }
  .er-dots-item.relieve { color:#0f172a; }
  .er-dots-item.relieve:hover { background:#f1f5f9; }
  .er-dots-divider { height:1px; background:#f1f5f9; margin:4px 0; flex-shrink:0; }

  /* ── Empty State ── */
  .er-empty { padding:52px 24px; text-align:center; }
  .er-empty-icon { width:52px; height:52px; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#94a3b8; }
  .er-empty p    { font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:#64748b; margin-bottom:4px; }
  .er-empty span { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#94a3b8; }

  /* ── Drawer ── */
  .er-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:100; animation:erFade 0.18s ease both; }
  @keyframes erFade { from{opacity:0} to{opacity:1} }
  .er-drawer {
    position:fixed; top:0; right:0; bottom:0; width:540px;
    background:#fff; z-index:101; overflow:hidden;
    box-shadow:-8px 0 40px rgba(15,23,42,.14);
    animation:erSlide 0.22s cubic-bezier(.16,1,.3,1) both;
    display:flex; flex-direction:column;
  }
  @keyframes erSlide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .er-drawer-head {
    display:flex; align-items:flex-start; justify-content:space-between;
    padding:20px 24px 16px; border-bottom:1px solid #f1f5f9;
    position:sticky; top:0; background:#fff; z-index:1; flex-shrink:0;
  }
  .er-drawer-av   { width:50px; height:50px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:17px; font-weight:700; color:#fff; }
  .er-drawer-name { font-family:'DM Sans',sans-serif; font-size:17px; font-weight:700; color:#0f172a; letter-spacing:-0.4px; }
  .er-drawer-sub  { font-family:'Inter',sans-serif; font-size:11.5px; color:#94a3b8; margin-top:2px; font-variant-numeric:tabular-nums; }
  .er-drawer-close { width:30px; height:30px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; flex-shrink:0; transition:all 0.13s; padding:0; }
  .er-drawer-close:hover { background:#f1f5f9; color:#0f172a; }
  .er-drawer-scroll { flex:1; overflow-y:auto; padding:0 24px 24px; }
  .er-drawer-section { margin-top:22px; }
  .er-drawer-section-title {
    font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:700; color:#1d4ed8;
    letter-spacing:0.1em; text-transform:uppercase;
    margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #eff6ff;
  }
  .er-info-grid   { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .er-info-field  label { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#94a3b8; display:block; margin-bottom:3px; }
  .er-info-field  span  { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#0f172a; font-weight:500; display:block; }
  .er-reason-box  { padding:12px 14px; background:#f8fafc; border:1px solid #e8edf5; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#334155; line-height:1.55; }

  /* ── Clearance Checklist ── */
  .er-clearance-list { display:flex; flex-direction:column; gap:10px; }
  .er-clearance-item {
    display:flex; align-items:flex-start; gap:12px;
    padding:12px 14px; border-radius:10px;
    border:1px solid #e2e8f0; background:#f8fafc; transition:border-color 0.14s;
  }
  .er-clearance-item.approved { background:#f0fdf4; border-color:#bbf7d0; }
  .er-clearance-item.pending  { background:#fffbeb; border-color:#fde68a; }
  .er-clearance-icon {
    width:32px; height:32px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
  }
  .er-clearance-icon.approved { background:#dcfce7; color:#15803d; }
  .er-clearance-icon.pending  { background:#fef3c7; color:#b45309; }
  .er-clearance-dept   { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; color:#0f172a; }
  .er-clearance-by     { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:500; color:#64748b; margin-top:2px; }
  .er-clearance-remarks{ font-family:'DM Sans',sans-serif; font-size:12px; color:#64748b; margin-top:4px; font-style:italic; }
  .er-clearance-status { margin-left:auto; flex-shrink:0; }
  .er-clearance-pill   { display:inline-block; padding:3px 10px; border-radius:99px; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; }
  .er-clearance-pill.approved { background:#dcfce7; color:#15803d; }
  .er-clearance-pill.pending  { background:#fef3c7; color:#b45309; }
  .er-clearance-input {
    width:100%; margin-top:8px; height:32px; padding:0 10px;
    border:1.5px solid #e2e8f0; border-radius:7px;
    font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; color:#0f172a;
    background:#fff; outline:none; transition:border-color 0.14s;
  }
  .er-clearance-input:focus { border-color:#1d4ed8; }
  .er-clearance-approve-btn {
    margin-top:8px; height:28px; padding:0 12px; border-radius:6px;
    border:1px solid #bbf7d0; background:#f0fdf4; color:#15803d;
    font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.12s;
  }
  .er-clearance-approve-btn:hover { background:#dcfce7; }

  /* ── Settlement Checklist ── */
  .er-settlement-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .er-settle-item {
    display:flex; align-items:center; gap:9px;
    padding:10px 12px; border-radius:9px; border:1px solid #e2e8f0; background:#f8fafc;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#334155;
    cursor:pointer; transition:all 0.12s; user-select:none;
  }
  .er-settle-item.done { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
  .er-settle-check {
    width:18px; height:18px; border-radius:5px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border:2px solid #e2e8f0; background:#fff; transition:all 0.12s;
  }
  .er-settle-item.done .er-settle-check { background:#15803d; border-color:#15803d; color:#fff; }

  /* ── Exit Interview ── */
  .er-interview-box {
    padding:12px 14px; background:#f8fafc; border:1px solid #e8edf5;
    border-radius:10px; margin-top:8px;
  }
  .er-interview-notes {
    width:100%; height:72px; padding:9px 12px; margin-top:8px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#fff; outline:none; resize:none;
  }
  .er-interview-notes:focus { border-color:#1d4ed8; }

  /* ── HR Remarks ── */
  .er-hr-remarks {
    width:100%; height:60px; padding:9px 12px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; resize:none; margin-top:6px;
  }
  .er-hr-remarks:focus { border-color:#1d4ed8; background:#fff; }

  /* ── Drawer Footer ── */
  .er-drawer-foot {
    display:flex; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9;
    background:#fafbfe; flex-shrink:0;
  }
  .er-drawer-btn {
    flex:1; height:38px; border-radius:8px; border:none;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;
    transition:all 0.13s;
  }
  .er-drawer-approve { background:#15803d; color:#fff; box-shadow:0 2px 6px rgba(21,128,61,.25); }
  .er-drawer-approve:hover { background:#166534; }
  .er-drawer-reject  { background:#fff; color:#dc2626; border:1.5px solid #fecaca !important; }
  .er-drawer-reject:hover { background:#fef2f2; }
  .er-drawer-neutral { background:#fff; color:#64748b; border:1.5px solid #e2e8f0 !important; }
  .er-drawer-neutral:hover { background:#f1f5f9; }
  .er-drawer-relieve { background:#0f172a; color:#fff; box-shadow:0 2px 8px rgba(15,23,42,.25); }
  .er-drawer-relieve:hover { background:#1e293b; }

  /* ── Confirm Modal ── */
  .er-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.45); z-index:200; display:flex; align-items:center; justify-content:center; animation:erFade 0.18s ease both; }
  .er-modal { background:#fff; border-radius:16px; padding:28px; width:400px; box-shadow:0 20px 60px rgba(15,23,42,.22); animation:erModalUp 0.2s cubic-bezier(.16,1,.3,1) both; }
  @keyframes erModalUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .er-modal-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
  .er-modal h3 { font-family:'DM Sans',sans-serif; font-size:17px; font-weight:700; color:#0f172a; margin-bottom:8px; letter-spacing:-0.3px; }
  .er-modal p  { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#64748b; line-height:1.55; margin-bottom:14px; }
  .er-modal-actions { display:flex; gap:10px; }
  .er-modal-cancel  { flex:1; height:38px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.12s; }
  .er-modal-cancel:hover { background:#f1f5f9; }
  .er-modal-confirm { flex:1; height:38px; border-radius:8px; border:none; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer; transition:all 0.12s; }

  /* ── Row Animation ── */
  @keyframes erRowIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  .er-row-in { animation:erRowIn 0.22s ease both; }

  /* ── Toast ── */
  .er-toast {
    position:fixed; bottom:28px; right:28px; background:#0f172a; color:#fff;
    padding:12px 18px; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;
    display:flex; align-items:center; gap:9px;
    box-shadow:0 8px 24px rgba(0,0,0,.22); z-index:9999;
    animation:erToast 0.3s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes erToast { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /* ── Progress Bar ── */
  .er-progress-wrap { margin-top:10px; }
  .er-progress-label { display:flex; justify-content:space-between; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#64748b; margin-bottom:6px; }
  .er-progress-track { height:6px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
  .er-progress-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,#1d4ed8,#60a5fa); transition:width 0.4s ease; }

  /* ── Pagination ── */
  .er-pagination { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfe; }
  .er-pag-info { font-family:'DM Sans',sans-serif; font-size: 13px; color: #64748b; font-weight: 500; }
  .er-pag-btns { display: flex; gap: 8px; }
  .er-pag-btn { padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; font-family:'DM Sans',sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; color: #334155; transition: 0.2s; }
  .er-pag-btn:hover:not(:disabled) { background: #f8fafc; border-color: #1d4ed8; color: #1d4ed8; transform: translateY(-1px); }
  .er-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .er-pag-btn.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; box-shadow: 0 2px 8px rgba(29,78,216,0.2); }
`;

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: ExitStatus }) {
  const map: Record<ExitStatus, string> = {
    "Pending Approval": "er-badge er-badge-pending",
    Approved: "er-badge er-badge-approved",
    "Clearance In Progress": "er-badge er-badge-clearance",
    Relieved: "er-badge er-badge-relieved",
    Rejected: "er-badge er-badge-rejected",
  };
  return <span className={map[status]}>{status}</span>;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="10"
      height="10"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? "#1d4ed8" : "#cbd5e1"}
      strokeWidth={2.5}
    >
      {active && dir === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 10l7-7 7 7m-7-7v18"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 14l-7 7-7-7m7 7V3"
        />
      )}
    </svg>
  );
}

interface SortThProps {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}
function SortTh({ field, label, sortField, sortDir, onSort }: SortThProps) {
  return (
    <th
      className={sortField === field ? "er-sorted" : ""}
      onClick={() => onSort(field)}
    >
      <div className="er-th-inner">
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </div>
    </th>
  );
}

interface VFProps {
  label: string;
  value: string;
}
function VF({ label, value }: VFProps) {
  return (
    <div className="er-info-field">
      <label>{label}</label>
      <span>{value || "—"}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXIT REQUEST FORM
───────────────────────────────────────────── */
interface CreateRelievingInput {
  employee_id: string;
  employee_code: string;
  resignation_date: string;
  last_working_date: string;
  notice_period_days: number;
  reason: string;
}

/* ─────────────────────────────────────────────
   3-DOT ACTION MENU
───────────────────────────────────────────── */
interface DotsMenuProps {
  rec: ExitRecord;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRelieve: () => void;
}
function DotsMenu({
  rec,
  onView,
  onApprove,
  onReject,
  onRelieve,
}: DotsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isPending = rec.status === "Pending Approval";
  const canRelieve = rec.status === "Clearance In Progress";

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      className="er-dots-wrap"
      ref={wrapRef}
      style={{ zIndex: open ? 2000 : 1 }}
    >
      <button
        className="er-dots-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="12" cy="19" r="2.5" />
        </svg>
      </button>
      {open && (
        <div className="er-dots-menu">
          <button
            className="er-dots-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onView();
            }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </button>
          {isPending && (
            <>
              <div className="er-dots-divider" />
              <button
                className="er-dots-item approve"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onApprove();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirm Relieve
              </button>
              <button
                className="er-dots-item reject"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onReject();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject
              </button>
            </>
          )}
          {canRelieve && (
            <>
              <div className="er-dots-divider" />
              <button
                className="er-dots-item relieve"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onRelieve();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Confirm Relieve
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RECORD EXIT MODAL
───────────────────────────────────────────── */
interface RecordExitModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  employees: RelievingEmployee[];
  createRelieving: (options: {
    variables: { input: CreateRelievingInput };
  }) => void;
}
function RecordExitModal({
  open,
  onClose,
  onToast,
  employees,
  createRelieving,
}: RecordExitModalProps) {
  const blank: FormState = {
    empId: "",
    resignDate: "",
    lastWorkingDay: "",
    exitReason: "Personal Reasons",
    exitReasonDetail: "",
    reportingManager: "",
  };
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!open) return null;

  const noticeDays = calcNoticeDays(form.resignDate, form.lastWorkingDay);
  const selectedEmp = employees.find(
    (e) => e.id === form.empId || e.employee_id === form.empId,
  );

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p: FormState) => ({ ...p, [k]: v }));
    setErrors((p: FormErrors) => ({ ...p, [k]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.empId) e.empId = "Please select an employee.";
    if (!form.resignDate) e.resignDate = "Resignation date is required.";
    if (!form.lastWorkingDay)
      e.lastWorkingDay = "Last working day is required.";
    if (
      form.resignDate &&
      form.lastWorkingDay &&
      form.lastWorkingDay < form.resignDate
    )
      e.lastWorkingDay = "Last working day cannot be before resignation date.";
    if (!form.exitReasonDetail.trim())
      e.exitReasonDetail = "Please provide exit reason details.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !selectedEmp) return;
    createRelieving({
      variables: {
        input: {
          employee_id: selectedEmp.id,
          employee_code: selectedEmp.employee_id,
          resignation_date: form.resignDate,
          last_working_date: form.lastWorkingDay,
          notice_period_days: noticeDays,
          reason: form.exitReason,
        },
      },
    });
    onToast(
      `Exit request submitted for ${selectedEmp.first_name} ${selectedEmp.last_name}.`,
    );
    setForm({ ...blank });
    setErrors({});
    onClose();
  }

  return (
    <div className="er-modal-overlay" onClick={onClose}>
      <div
        className="er-modal"
        style={{ width: "580px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="er-form-icon" style={{ background: "#fff1f2" }}>
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#e11d48"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
                Record Exit Request
              </h3>
              <p className="er-sub" style={{ margin: 0, fontSize: "12.5px" }}>
                Submit a new employee resignation record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="er-form-grid">
          <div>
            <label className="er-label">
              Employee<span className="er-req">*</span>
            </label>
            <select
              className={`er-select${errors.empId ? " er-input-error" : ""}`}
              value={form.empId}
              onChange={(e) => setF("empId", e.target.value)}
            >
              <option value="">Select Employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {errors.empId && <div className="er-error-msg">{errors.empId}</div>}
          </div>
          <div>
            <label className="er-label">
              Exit Reason<span className="er-req">*</span>
            </label>
            <select
              className="er-select"
              value={form.exitReason}
              onChange={(e) => setF("exitReason", e.target.value as ExitReason)}
            >
              {EXIT_REASONS.map((r: ExitReason) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="er-form-grid-3">
          <div>
            <label className="er-label">
              Resignation Date<span className="er-req">*</span>
            </label>
            <input
              type="date"
              className={`er-input${errors.resignDate ? " er-input-error" : ""}`}
              value={form.resignDate}
              onChange={(e) => setF("resignDate", e.target.value)}
            />
            {errors.resignDate && (
              <div className="er-error-msg">{errors.resignDate}</div>
            )}
          </div>
          <div>
            <label className="er-label">
              Last Working Day<span className="er-req">*</span>
            </label>
            <input
              type="date"
              className={`er-input${errors.lastWorkingDay ? " er-input-error" : ""}`}
              value={form.lastWorkingDay}
              onChange={(e) => setF("lastWorkingDay", e.target.value)}
            />
            {errors.lastWorkingDay && (
              <div className="er-error-msg">{errors.lastWorkingDay}</div>
            )}
          </div>
          <div>
            <label className="er-label">Notice Period</label>
            <div
              className="er-days-badge"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
            >
              {noticeDays > 0 ? `${noticeDays} days` : "—"}
            </div>
          </div>
        </div>

        <div className="er-form-full">
          <label className="er-label">
            Detailed Reason / Notes<span className="er-req">*</span>
          </label>
          <textarea
            className={`er-textarea${errors.exitReasonDetail ? " er-input-error" : ""}`}
            style={{ height: "90px" }}
            placeholder="Describe specific reasons for resignation…"
            value={form.exitReasonDetail}
            onChange={(e) => setF("exitReasonDetail", e.target.value)}
          />
          {errors.exitReasonDetail && (
            <div className="er-error-msg">{errors.exitReasonDetail}</div>
          )}
        </div>

        <div className="er-modal-actions" style={{ marginTop: "10px" }}>
          <button className="er-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="er-modal-confirm"
            style={{ background: "#e11d48" }}
            onClick={handleSubmit}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXIT DETAIL DRAWER
───────────────────────────────────────────── */
interface DrawerProps {
  rec: ExitRecord;
  onClose: () => void;
  onApprove: (id: string, remarks: string) => void;
  onReject: (id: string, name: string, remarks: string) => void;
  onRelieve: (id: string) => void;
  onRejoin: (id: string, name: string) => void;
  onClearanceUpdate: () => void;
  onSettlementToggle: (id: string, key: keyof Settlement) => void;
  onInterviewSave: (id: string, done: boolean, notes: string) => void;
}

function ExitDrawer({
  rec,
  onClose,
  onApprove,
  onReject,
  onRelieve,
  onRejoin,
  onClearanceUpdate,
  onSettlementToggle,
  onInterviewSave,
}: DrawerProps) {
  const [hrRemarks, setHrRemarks] = useState<string>(rec.hrRemarks || "");
  const [clearanceRemarks, setClearanceRemarks] = useState<string[]>(
    (rec.clearances || []).map((c: Clearance) => c.remarks || ""),
  );
  const [intDone, setIntDone] = useState<boolean>(!!rec.exitInterviewDone);
  const [intNotes, setIntNotes] = useState<string>(
    rec.exitInterviewNotes || "",
  );

  const approvedCount = (rec.clearances || []).filter(
    (c: Clearance) => c.status === "Approved",
  ).length;
  const totalClearances = (rec.clearances || []).length;
  const clearancePct =
    totalClearances > 0
      ? Math.round((approvedCount / totalClearances) * 100)
      : 0;

  const settleKeys: Array<[keyof Settlement, string]> = [
    ["salarySettled", "Salary Settlement"],
    ["pfSettled", "PF Settlement"],
    ["gratuitySettled", "Gratuity Settlement"],
    ["expenseSettled", "Expense Claims"],
    ["noDuesIssued", "No Dues Certificate"],
    ["experienceLetterIssued", "Experience Letter"],
  ];
  const settledCount = settleKeys.filter(([k]) => rec.settlement?.[k]).length;

  const allClear = totalClearances > 0 && approvedCount === totalClearances;
  const canRelieve =
    rec.status === "Clearance In Progress" &&
    allClear &&
    settledCount === settleKeys.length;

  return (
    <>
      <div className="er-overlay" onClick={onClose} />
      <div className="er-drawer">
        <div className="er-drawer-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="er-drawer-av"
              style={{ background: rec.avatarColor }}
            >
              {getInitials(rec.firstName, rec.lastName)}
            </div>
            <div>
              <div className="er-drawer-name">
                {rec.firstName} {rec.lastName}
              </div>
              <div className="er-drawer-sub">
                {rec.empId} · {rec.department}
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <StatusBadge status={rec.status} />
                <span
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#94a3b8",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  LWD: {formatDate(rec.lastWorkingDay)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(rec.status === "Relieved" ||
              rec.status === "Approved" ||
              rec.status === "Rejected") && (
              <button
                className="er-header-btn er-header-btn-primary"
                style={{
                  background: "#15803d",
                  borderColor: "#15803d",
                  height: 34,
                  fontSize: 12,
                }}
                onClick={() =>
                  onRejoin(rec.employeeDbId, `${rec.firstName} ${rec.lastName}`)
                }
              >
                Re-join
              </button>
            )}
            <button className="er-drawer-close" onClick={onClose}>
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="er-drawer-scroll">
          <div className="er-drawer-section">
            <div className="er-drawer-section-title">Exit Details</div>
            <div className="er-info-grid">
              <VF label="Designation" value={rec.designation} />
              <VF label="Reporting Manager" value={rec.reportingManager} />
              <VF label="Joining Date" value={formatDate(rec.joiningDate)} />
              <VF label="Resignation Date" value={formatDate(rec.resignDate)} />
              <VF
                label="Last Working Day"
                value={formatDate(rec.lastWorkingDay)}
              />
              <VF label="Notice Period" value={`${rec.noticePeriod} days`} />
              <VF label="Exit Reason" value={rec.exitReason} />
              <VF label="Applied On" value={formatDate(rec.appliedDate)} />
              {rec.approvedBy && (
                <VF label="Approved By" value={rec.approvedBy} />
              )}
              {rec.approvedOn && (
                <VF label="Approved On" value={formatDate(rec.approvedOn)} />
              )}
            </div>
          </div>

          <div className="er-drawer-section">
            <div className="er-drawer-section-title">Reason / Notes</div>
            <div className="er-reason-box">{rec.exitReasonDetail}</div>
          </div>

          <div className="er-drawer-section">
            <div className="er-drawer-section-title">
              Department Clearances ({approvedCount}/{totalClearances})
            </div>
            <div className="er-progress-wrap">
              <div className="er-progress-label">
                <span>Clearance Progress</span>
                <span>{clearancePct}%</span>
              </div>
              <div className="er-progress-track">
                <div
                  className="er-progress-fill"
                  style={{ width: `${clearancePct}%` }}
                />
              </div>
            </div>
            <div className="er-clearance-list" style={{ marginTop: 12 }}>
              {rec.clearances.map((cl: Clearance, idx: number) => (
                <div
                  key={cl.dept}
                  className={`er-clearance-item ${cl.status.toLowerCase()}`}
                >
                  <div
                    className={`er-clearance-icon ${cl.status.toLowerCase()}`}
                  >
                    {cl.status === "Approved" ? (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="er-clearance-dept">{cl.dept}</div>
                    {cl.clearedBy ? (
                      <div className="er-clearance-by">
                        Cleared by {cl.clearedBy} on {formatDate(cl.clearedOn)}
                      </div>
                    ) : (
                      <div className="er-clearance-by">Not yet cleared</div>
                    )}
                    {cl.remarks && (
                      <div className="er-clearance-remarks">"{cl.remarks}"</div>
                    )}
                    {isHod() &&
                      cl.status === "Pending" &&
                      rec.status !== "Pending Approval" &&
                      rec.status !== "Rejected" && (
                        <div>
                          <input
                            type="text"
                            className="er-clearance-input"
                            placeholder="Add clearance remarks…"
                            value={clearanceRemarks[idx]}
                            onChange={(e) => {
                              const updated = [...clearanceRemarks];
                              updated[idx] = e.target.value;
                              setClearanceRemarks(updated);
                            }}
                          />
                          <button
                            className="er-clearance-approve-btn"
                            onClick={() => onClearanceUpdate()}
                          >
                            <svg
                              width="12"
                              height="12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Mark Cleared
                          </button>
                        </div>
                      )}
                  </div>
                  <div className="er-clearance-status">
                    <span
                      className={`er-clearance-pill ${cl.status.toLowerCase()}`}
                    >
                      {cl.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin() &&
            rec.status !== "Pending Approval" &&
            rec.status !== "Rejected" && (
              <div className="er-drawer-section">
                <div className="er-drawer-section-title">
                  Final Settlement ({settledCount}/{settleKeys.length})
                </div>
                <div className="er-settlement-grid">
                  {settleKeys.map(
                    ([key, label]: [keyof Settlement, string]) => (
                      <div
                        key={key}
                        className={`er-settle-item${rec.settlement[key] ? " done" : ""}`}
                        onClick={() => onSettlementToggle(rec.id, key)}
                      >
                        <div className="er-settle-check">
                          {rec.settlement[key] && (
                            <svg
                              width="11"
                              height="11"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        {label}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {rec.status !== "Pending Approval" && rec.status !== "Rejected" && (
            <div className="er-drawer-section">
              <div className="er-drawer-section-title">Exit Interview</div>
              <div className="er-interview-box">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    className={`er-settle-item${intDone ? " done" : ""}`}
                    style={{ flex: 1, cursor: "pointer" }}
                    onClick={() => setIntDone((v: boolean) => !v)}
                  >
                    <div className="er-settle-check">
                      {intDone && (
                        <svg
                          width="11"
                          height="11"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    Exit Interview Conducted
                  </div>
                </div>
                {intDone && (
                  <textarea
                    className="er-interview-notes"
                    placeholder="Interview notes / feedback summary…"
                    value={intNotes}
                    onChange={(e) => setIntNotes(e.target.value)}
                  />
                )}
                <button
                  style={{
                    marginTop: 10,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                  onClick={() => onInterviewSave(rec.id, intDone, intNotes)}
                >
                  Save Interview Status
                </button>
              </div>
            </div>
          )}

          <div className="er-drawer-section">
            <div className="er-drawer-section-title">HR Remarks</div>
            {rec.hrRemarks && rec.status !== "Pending Approval" ? (
              <div className="er-reason-box">{rec.hrRemarks}</div>
            ) : (
              <textarea
                className="er-hr-remarks"
                placeholder="Add HR remarks before approving or rejecting…"
                value={hrRemarks}
                onChange={(e) => setHrRemarks(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="er-drawer-foot">
          {isAdmin() && rec.status === "Pending Approval" && (
            <>
              <button
                className="er-drawer-btn er-drawer-reject"
                onClick={() =>
                  onReject(
                    rec.id,
                    `${rec.firstName} ${rec.lastName}`,
                    hrRemarks,
                  )
                }
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject
              </button>
              <button
                className="er-drawer-btn er-drawer-approve"
                onClick={() => onApprove(rec.id, hrRemarks)}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirm Relieve
              </button>
            </>
          )}
          {isAdmin() && rec.status === "Clearance In Progress" && (
            <button
              className="er-drawer-btn er-drawer-relieve"
              style={{
                opacity: canRelieve ? 1 : 0.5,
                cursor: canRelieve ? "pointer" : "not-allowed",
              }}
              onClick={() => {
                if (canRelieve) onRelieve(rec.id);
              }}
              title={
                canRelieve
                  ? "Mark as Relieved"
                  : "Complete all clearances and settlement first"
              }
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {canRelieve ? "Confirm Relieve" : "Clearances Pending"}
            </button>
          )}
          {(rec.status === "Relieved" ||
            rec.status === "Approved" ||
            rec.status === "Rejected") && (
            <button
              className="er-drawer-btn er-drawer-neutral"
              style={{ flex: "unset", width: "100%" }}
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM RELIEVE MODAL
───────────────────────────────────────────── */
interface ConfirmRelieveModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmRelieveModal({
  name,
  onConfirm,
  onCancel,
}: ConfirmRelieveModalProps) {
  return (
    <div className="er-modal-overlay" onClick={onCancel}>
      <div
        className="er-modal"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          className="er-modal-icon"
          style={{ background: "#f0fdf4", color: "#15803d" }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3>Confirm Relieving?</h3>
        <p>
          Are you sure you want to confirm relieving for <strong>{name}</strong>
          ? This action will update their official status.
        </p>
        <div className="er-modal-actions">
          <button className="er-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="er-modal-confirm"
            style={{ background: "#15803d" }}
            onClick={onConfirm}
          >
            Yes, Confirm Relieve
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REJECT MODAL
───────────────────────────────────────────── */
interface RejectModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function RejectModal({ name, onConfirm, onCancel }: RejectModalProps) {
  return (
    <div className="er-modal-overlay" onClick={onCancel}>
      <div
        className="er-modal"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          className="er-modal-icon"
          style={{ background: "#fef2f2", color: "#dc2626" }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3>Reject Exit Request?</h3>
        <p>
          Are you sure you want to reject {name}'s exit request? They will be
          notified and the request will be closed.
        </p>
        <div className="er-modal-actions">
          <button className="er-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="er-modal-confirm"
            style={{ background: "#dc2626" }}
            onClick={onConfirm}
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RE-JOIN MODAL
───────────────────────────────────────────── */
interface RejoinModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function RejoinModal({ name, onConfirm, onCancel }: RejoinModalProps) {
  return (
    <div className="er-modal-overlay" onClick={onCancel}>
      <div
        className="er-modal"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          className="er-modal-icon"
          style={{ background: "#f0fdf4", color: "#15803d" }}
        >
          <svg
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h3>Confirm Re-joining?</h3>
        <p>
          Are you sure you want to restore <strong>{name}</strong> to the active
          staff management list? Their system access will be re-enabled.
        </p>
        <div className="er-modal-actions">
          <button className="er-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="er-modal-confirm"
            style={{
              background: "#15803d",
              minWidth: "180px",
              whiteSpace: "nowrap",
            }}
            onClick={onConfirm}
          >
            Yes, Restore Employee
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Relieving() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "All",
    status: "All",
    dateFrom: "",
  });

  const { data, loading, error, refetch } = useQuery<RelievingData>(
    GET_RELIEVINGS,
    {
      variables: {
        pagination: { page: currentPage, limit: itemsPerPage },
        status: filters.status === "All" ? undefined : filters.status,
      },
      fetchPolicy: "network-only",
    },
  );

  const { data: empData } = useQuery<{
    getAllEmployees: { items: RelievingEmployee[] };
  }>(GET_EMPLOYEES, {
    variables: { pagination: { page: 1, limit: 1000 } },
  });
  const fetchedEmployees = empData?.getAllEmployees?.items || [];

  const [createRelieving] = useMutation(CREATE_RELIEVING, {
    onCompleted: () => {
      showToast("Exit request recorded successfully.");
      refetch();
    },
    onError: (err) => showToast("Error: " + err.message),
  });

  const [updateRelieving] = useMutation(UPDATE_RELIEVING, {
    onCompleted: () => {
      showToast("Exit record updated successfully.");
      refetch();
    },
  });

  const [reHireEmployee] = useMutation<{
    reHireEmployee: { first_name: string };
  }>(REHIRE_EMPLOYEE, {
    onCompleted: (data) => {
      showToast(
        `${data.reHireEmployee.first_name} has been restored to Employee Management.`,
      );
      refetch();
    },
    onError: (err) => showToast("Error: " + err.message),
  });

  const records: ExitRecord[] = useMemo(() => {
    return (data?.relievings?.items || []).map((r: BackendRelieving) => ({
      id: r.id,
      empId: r.employee_code || r.employee_id,
      firstName: r.employee?.first_name || "Unknown",
      lastName: r.employee?.last_name || "",
      department: r.employee?.work_detail?.department?.name || "N/A",
      designation: r.employee?.work_detail?.designation?.name || "N/A",
      avatarColor: "#2563eb", // Consistent blue as requested
      officialEmail: r.employee?.user_email || "N/A",
      phone: r.employee?.user_contact || "N/A",
      reportingManager: r.employee?.work_detail?.reporting_to
        ? "Manager Assigned"
        : "Admin",
      joiningDate: r.employee?.work_detail?.date_of_joining || "N/A",
      resignDate: r.resignation_date,
      lastWorkingDay: r.last_working_date,
      noticePeriod: r.notice_period_days || 0,
      exitReason: (r.reason || "Other") as ExitReason,
      exitReasonDetail: r.remarks || "",
      status: (r.status as ExitStatus) || "Pending Approval",
      appliedDate: r.created_at || "",
      approvedBy: "N/A",
      approvedOn: "N/A",
      hrRemarks: r.remarks || "",
      clearances: [],
      settlement: {
        salarySettled: false,
        pfSettled: false,
        gratuitySettled: false,
        expenseSettled: false,
        noDuesIssued: false,
        experienceLetterIssued: false,
      },
      exitInterviewDone: r.exit_interview_done || false,
      exitInterviewNotes: r.remarks || "",
      employeeDbId: r.employee?.id || "",
    }));
  }, [data]);

  const pageInfo = data?.relievings?.pageInfo;
  const totalPages = pageInfo?.totalPages || 1;
  const totalCount = pageInfo?.totalCount || 0;

  const [sortField, setSortField] = useState<SortField>("resignDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerRec, setDrawerRec] = useState<ExitRecord | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    name: string;
    remarks: string;
  } | null>(null);
  const [relieveTarget, setRelieveTarget] = useState<{
    id: string;
    name: string;
    status: ExitStatus;
    remarks?: string;
  } | null>(null);
  const [rejoinTarget, setRejoinTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }

  /* Filtered + sorted */
  const filtered = useMemo<ExitRecord[]>(() => {
    let list = [...records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r: ExitRecord) =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          r.empId.toLowerCase().includes(q),
      );
    }
    if (filters.department !== "All")
      list = list.filter(
        (r: ExitRecord) => r.department === filters.department,
      );
    if (filters.status !== "All")
      list = list.filter((r: ExitRecord) => r.status === filters.status);
    if (filters.dateFrom)
      list = list.filter(
        (r: ExitRecord) => r.lastWorkingDay >= filters.dateFrom,
      );

    list.sort((a: ExitRecord, b: ExitRecord) => {
      let va = "",
        vb = "";
      if (sortField === "name") {
        va = `${a.firstName} ${a.lastName}`;
        vb = `${b.firstName} ${b.lastName}`;
      }
      if (sortField === "empId") {
        va = a.empId;
        vb = b.empId;
      }
      if (sortField === "department") {
        va = a.department;
        vb = b.department;
      }
      if (sortField === "resignDate") {
        va = a.resignDate;
        vb = b.resignDate;
      }
      if (sortField === "lastDay") {
        va = a.lastWorkingDay;
        vb = b.lastWorkingDay;
      }
      if (sortField === "status") {
        va = a.status;
        vb = b.status;
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [records, filters, sortField, sortDir]);

  /* Stats */
  const stats = useMemo(
    () => ({
      total: records.length,
      pending: records.filter(
        (r: ExitRecord) => r.status === "Pending Approval",
      ).length,
      clearance: records.filter(
        (r: ExitRecord) =>
          r.status === "Clearance In Progress" || r.status === "Approved",
      ).length,
      relieved: records.filter((r: ExitRecord) => r.status === "Relieved")
        .length,
    }),
    [records],
  );

  function handleSort(field: SortField) {
    if (sortField === field)
      setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function setFilter<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    setFilters((prev: FilterState) => ({ ...prev, [key]: val }));
  }

  /* Approve */
  function initiateApprove(id: string, name: string, remarks: string) {
    setRelieveTarget({ id, name, status: "Pending Approval", remarks });
  }

  /* Reject */
  function initiateReject(id: string, name: string, remarks: string) {
    setRejectTarget({ id, name, remarks });
  }
  function confirmReject() {
    if (!rejectTarget) return;
    updateRelieving({
      variables: {
        id: rejectTarget.id,
        input: { status: "Rejected", remarks: rejectTarget.remarks },
      },
      refetchQueries: [
        { query: GET_RELIEVINGS },
        { query: GET_DASHBOARD_STATS },
        { query: GET_EMPLOYEES },
        { query: GET_LEAVES },
        { query: GET_MOVEMENTS },
      ],
    });
    if (drawerRec?.id === rejectTarget.id) setDrawerRec(null);
    showToast("Exit request rejected.");
    setRejectTarget(null);
  }

  /* Relieve */
  function initiateRelieve(id: string, name: string) {
    setRelieveTarget({ id, name, status: "Clearance In Progress" });
  }

  function handleRelieve(id: string) {
    updateRelieving({
      variables: {
        id: id,
        input: { status: "Relieved" },
      },
      refetchQueries: [
        { query: GET_RELIEVINGS },
        { query: GET_DASHBOARD_STATS },
        { query: GET_EMPLOYEES },
        { query: GET_LEAVES },
        { query: GET_MOVEMENTS },
      ],
    });
    if (drawerRec?.id === id) setDrawerRec(null);
    showToast("Employee marked as Relieved. All clearances complete.");
  }

  /* Re-join */
  function initiateRejoin(id: string, name: string) {
    setRejoinTarget({ id, name });
  }
  function confirmRejoin() {
    if (!rejoinTarget) return;
    reHireEmployee({
      variables: { id: rejoinTarget.id },
      refetchQueries: [
        { query: GET_RELIEVINGS },
        { query: GET_EMPLOYEES },
        { query: GET_DASHBOARD_STATS },
      ],
    });
    if (drawerRec?.id === rejoinTarget.id) setDrawerRec(null);
    setRejoinTarget(null);
  }

  /* Clearance update */
  function handleClearanceUpdate() {
    showToast(`Clearance approved successfully.`);
  }

  /* Settlement toggle */
  function handleSettlementToggle(id: string, key: keyof Settlement) {
    // For now, no specific backend field for this, but can map to assets_returned if it fits
    if (key === "noDuesIssued") {
      updateRelieving({ variables: { id, input: { assets_returned: true } } });
    }
  }

  /* Interview save */
  function handleInterviewSave(id: string, done: boolean, notes: string) {
    updateRelieving({
      variables: {
        id,
        input: { exit_interview_done: done, remarks: notes },
      },
    });
    showToast("Exit interview status saved.");
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "70vh",
          background: "#fff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #f1f5f9",
              borderTopColor: "#1d4ed8",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              color: "#64748b",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Loading relieving records...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          background: "#fff",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            background: "#fef2f2",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#dc2626"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3
          style={{
            fontFamily: "'DM Sans',sans-serif",
            color: "#0f172a",
            margin: 0,
          }}
        >
          Failed to load data
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans',sans-serif",
            color: "#64748b",
            fontSize: 14,
            marginTop: 8,
            maxWidth: 400,
          }}
        >
          {error.message ||
            "An unexpected error occurred while fetching exit requests."}
        </p>
        <button
          onClick={() => refetch()}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            borderRadius: 9,
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            boxShadow: "0 4px 12px rgba(29,78,216,0.2)",
          }}
        >
          Try Again
        </button>
      </div>
    );

  /* ── RENDER ── */
  return (
    <div className="er-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div className="er-header">
        <div>
          <h1 className="er-title">Employee Relieving</h1>
          <p className="er-sub">
            Manage employee exits, resignation approvals, clearances, and final
            settlements.
          </p>
        </div>
        {isAdmin() && (
          <div className="er-header-actions">
            <button
              className="er-header-btn"
              onClick={() => showToast("Exit report exported.")}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Report
            </button>
            <button
              className="er-header-btn er-header-btn-primary"
              onClick={() => setFormOpen((v: boolean) => !v)}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Record Exit
            </button>
          </div>
        )}
      </div>

      {/* Record Exit Modal — triggered by header button */}
      <RecordExitModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onToast={showToast}
        employees={fetchedEmployees}
        createRelieving={createRelieving}
      />

      {/* Stat Cards */}
      <div className="er-stats">
        {(
          [
            {
              label: "Total Exit Requests",
              value: stats.total,
              sub: "All time",
              color: "#1d4ed8",
              bg: "#eff6ff",
            },
            {
              label: "Pending Approvals",
              value: stats.pending,
              sub: "Awaiting HR decision",
              color: "#b45309",
              bg: "#fffbeb",
            },
            {
              label: "Clearance In Progress",
              value: stats.clearance,
              sub: "In exit process",
              color: "#1d4ed8",
              bg: "#eff6ff",
            },
            {
              label: "Employees Relieved",
              value: stats.relieved,
              sub: "Successfully exited",
              color: "#059669",
              bg: "#f0fdf4",
            },
          ] as const
        ).map((s) => (
          <div key={s.label} className="er-stat-card">
            <div className="er-stat-icon" style={{ background: s.bg }}>
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke={s.color}
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div>
              <div className="er-stat-val" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="er-stat-lbl">{s.label}</div>
              <div className="er-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="er-section">
        {/* Filter Bar — single date filter for Relieving Date */}
        <div className="er-filter-bar">
          <div className="er-search-wrap">
            <span className="er-search-icon">
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>
            </span>
            <input
              className="er-search"
              placeholder="Search name or ID…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
            />
          </div>

          <div className="er-filter-divider" />

          <select
            className="er-filter-sel"
            value={filters.department}
            onChange={(e) => setFilter("department", e.target.value)}
          >
            {DEPARTMENTS.map((d: string) => (
              <option key={d} value={d}>
                {d === "All" ? "All Departments" : d}
              </option>
            ))}
          </select>

          <select
            className="er-filter-sel"
            value={filters.status}
            onChange={(e) =>
              setFilter("status", e.target.value as FilterState["status"])
            }
          >
            <option value="All">All Status</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Clearance In Progress">Clearance In Progress</option>
            <option value="Relieved">Relieved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            type="date"
            className="er-filter-date"
            value={filters.dateFrom}
            onChange={(e) => setFilter("dateFrom", e.target.value)}
          />

          <span className="er-filter-count">
            {filtered.length} of {records.length} records
          </span>
        </div>

        {/* Table — columns: Emp ID | Employee | Department | Designation | Relieving Date | Status | Actions */}
        <div className="er-table-wrap">
          {filtered.length === 0 ? (
            <div className="er-empty">
              <div className="er-empty-icon">
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.7}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <p>No exit records found</p>
              <span>Try adjusting the filters or record a new exit.</span>
            </div>
          ) : (
            <table className="er-table">
              <thead>
                <tr>
                  <SortTh
                    field="empId"
                    label="Emp ID"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    field="name"
                    label="Employee"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    field="department"
                    label="Department"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th>Designation</th>
                  <SortTh
                    field="lastDay"
                    label="Relieving Date"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    field="status"
                    label="Status"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec: ExitRecord, idx) => (
                  <tr key={rec.id} className={idx < 5 ? "er-row-in" : ""}>
                    {/* Emp ID — Inter */}
                    <td>
                      <span className="er-emp-id">{rec.empId}</span>
                    </td>

                    {/* Employee Name */}
                    <td>
                      <div className="er-emp-cell">
                        <div
                          className="er-emp-av"
                          style={{ background: rec.avatarColor }}
                        >
                          {getInitials(rec.firstName, rec.lastName)}
                        </div>
                        <div>
                          <div className="er-emp-name">
                            {rec.firstName} {rec.lastName}
                          </div>
                          <div className="er-emp-sub">{rec.officialEmail}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="er-dept-pill">{rec.department}</span>
                    </td>

                    {/* Designation */}
                    <td>
                      <span className="er-desig">{rec.designation}</span>
                    </td>

                    {/* Relieving Date — Inter */}
                    <td>
                      <span className="er-date-val">
                        {formatDate(rec.lastWorkingDay)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>

                    {/* Actions — 3-dot menu */}
                    <td style={{ textAlign: "center" }}>
                      <DotsMenu
                        rec={rec}
                        onView={() => setDrawerRec(rec)}
                        onApprove={() =>
                          initiateApprove(
                            rec.id,
                            `${rec.firstName} ${rec.lastName}`,
                            "",
                          )
                        }
                        onReject={() =>
                          initiateReject(
                            rec.id,
                            `${rec.firstName} ${rec.lastName}`,
                            "",
                          )
                        }
                        onRelieve={() =>
                          initiateRelieve(
                            rec.id,
                            `${rec.firstName} ${rec.lastName}`,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="er-pagination">
            <div className="er-pag-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
              results
            </div>
            <div className="er-pag-btns">
              <button
                className="er-pag-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`er-pag-btn ${p === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="er-pag-btn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerRec && (
        <ExitDrawer
          rec={drawerRec}
          onClose={() => setDrawerRec(null)}
          onApprove={(id: string, remarks: string) => {
            initiateApprove(
              id,
              `${drawerRec.firstName} ${drawerRec.lastName}`,
              remarks,
            );
          }}
          onReject={(id: string, name: string, remarks: string) => {
            initiateReject(id, name, remarks);
            setDrawerRec(null);
          }}
          onRelieve={(id: string) => {
            initiateRelieve(id, `${drawerRec.firstName} ${drawerRec.lastName}`);
          }}
          onRejoin={initiateRejoin}
          onClearanceUpdate={handleClearanceUpdate}
          onSettlementToggle={handleSettlementToggle}
          onInterviewSave={handleInterviewSave}
        />
      )}

      {/* Modals */}
      {rejoinTarget && (
        <RejoinModal
          name={rejoinTarget.name}
          onConfirm={confirmRejoin}
          onCancel={() => setRejoinTarget(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Confirm Relieve Modal */}
      {relieveTarget && (
        <ConfirmRelieveModal
          name={relieveTarget.name}
          onConfirm={() => {
            handleRelieve(relieveTarget.id);
            setRelieveTarget(null);
            setDrawerRec(null);
          }}
          onCancel={() => setRelieveTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="er-toast">
          <svg
            width="15"
            height="15"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#22c55e"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
