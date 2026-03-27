import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_RELIEVINGS, CREATE_RELIEVING, UPDATE_RELIEVING } from "../graphql/relievingQueries";
import { GET_EMPLOYEES } from "../graphql/employeeQueries";

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

type SortField = "name" | "empId" | "department" | "resignDate" | "lastDay" | "status";
type SortDir   = "asc" | "desc";

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

interface ExitRecord {
  id: number;
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
  "All","Computer Science And Engineering","Data Science","Aiml",
  "Information science","Library","Administration",

];

const EXIT_REASONS: ExitReason[] = [
  "Personal Reasons","Better Opportunity","Higher Studies",
  "Health Issues","Relocation","Family Reasons","Retirement","Other",
];



// let nextId = ... (Removed legacy mock id manager)

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${m[parseInt(p[1],10)-1]} ${p[2]}, ${p[0]}`;
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
    overflow:hidden; margin-bottom:20px;
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
  .er-table-wrap { overflow-x:auto; }
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
  .er-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background 0.1s; }
  .er-table tbody tr:last-child { border-bottom:none; }
  .er-table tbody tr:hover { background:#fafbfe; }
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
  .er-dots-wrap { position:relative; display:inline-flex; justify-content:center; }
  .er-dots-btn {
    width:30px; height:30px; border-radius:7px; border:1px solid #e2e8f0; background:#f8fafc;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; transition:all .13s; padding:0;
  }
  .er-dots-btn:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0f172a; }
  .er-dots-menu {
    position:absolute; top:calc(100% + 6px); right:0; z-index:50;
    background:#fff; border:1px solid #e2e8f0; border-radius:10px;
    box-shadow:0 8px 24px rgba(15,23,42,.12); min-width:160px; overflow:hidden;
    animation:erMenuIn .14s ease both;
  }
  @keyframes erMenuIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  .er-dots-item {
    display:flex; align-items:center; gap:9px;
    padding:9px 14px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#334155;
    cursor:pointer; transition:background .1s; white-space:nowrap;
    background:none; border:none; width:100%; text-align:left;
  }
  .er-dots-item:hover { background:#f8fafc; }
  .er-dots-item.approve { color:#15803d; }
  .er-dots-item.approve:hover { background:#f0fdf4; }
  .er-dots-item.reject  { color:#dc2626; }
  .er-dots-item.reject:hover  { background:#fef2f2; }
  .er-dots-divider { height:1px; background:#f1f5f9; margin:3px 0; }

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
`;

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: ExitStatus }) {
  const map: Record<ExitStatus, string> = {
    "Pending Approval":       "er-badge er-badge-pending",
    "Approved":               "er-badge er-badge-approved",
    "Clearance In Progress":  "er-badge er-badge-clearance",
    "Relieved":               "er-badge er-badge-relieved",
    "Rejected":               "er-badge er-badge-rejected",
  };
  return <span className={map[status]}>{status}</span>;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" fill="none" viewBox="0 0 24 24"
      stroke={active ? "#1d4ed8" : "#cbd5e1"} strokeWidth={2.5}>
      {active && dir === "asc"
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7m-7-7v18" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7-7-7m7 7V3" />
      }
    </svg>
  );
}

interface SortThProps {
  field: SortField; label: string;
  sortField: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void;
}
function SortTh({ field, label, sortField, sortDir, onSort }: SortThProps) {
  return (
    <th className={sortField === field ? "er-sorted" : ""} onClick={() => onSort(field)}>
      <div className="er-th-inner">
        {label}<SortIcon active={sortField === field} dir={sortDir} />
      </div>
    </th>
  );
}

interface VFProps { label: string; value: string; }
function VF({ label, value }: VFProps) {
  return (
    <div className="er-info-field">
      <label>{label}</label>
      <span>{value || "—"}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   3-DOT ACTION MENU
───────────────────────────────────────────── */
interface DotsMenuProps {
  rec: ExitRecord;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}
function DotsMenu({ rec, onView, onApprove, onReject }: DotsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isPending = rec.status === "Pending Approval";

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
    <div className="er-dots-wrap" ref={wrapRef}>
      <button className="er-dots-btn" onClick={() => setOpen((v) => !v)}>
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="er-dots-menu">
          <button className="er-dots-item" onClick={() => { setOpen(false); onView(); }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View Details
          </button>
          {isPending && (
            <>
              <div className="er-dots-divider"/>
              <button className="er-dots-item approve" onClick={() => { setOpen(false); onApprove(); }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Approve Relieving
              </button>
              <button className="er-dots-item reject" onClick={() => { setOpen(false); onReject(); }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Reject Request
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXIT REQUEST FORM
───────────────────────────────────────────── */
interface ExitFormProps {
  open: boolean;
  onToggle: () => void;
  onToast: (msg: string) => void;
  employees: any[];
  createRelieving: any;
}
function ExitForm({ open, onToggle, onToast, employees, createRelieving }: ExitFormProps) {
  const blank: FormState = {
    empId: "", resignDate: "", lastWorkingDay: "",
    exitReason: "Personal Reasons", exitReasonDetail: "", reportingManager: "",
  };
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<FormErrors>({});

  const noticeDays = calcNoticeDays(form.resignDate, form.lastWorkingDay);
  const selectedEmp = employees.find((e: any) => e.id === form.empId || e.employee_id === form.empId);

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p: FormState) => ({ ...p, [k]: v }));
    setErrors((p: FormErrors) => ({ ...p, [k]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.empId)             e.empId           = "Please select an employee.";
    if (!form.resignDate)        e.resignDate      = "Resignation date is required.";
    if (!form.lastWorkingDay)    e.lastWorkingDay   = "Last working day is required.";
    if (form.resignDate && form.lastWorkingDay && form.lastWorkingDay < form.resignDate)
      e.lastWorkingDay = "Last working day cannot be before resignation date.";
    if (!form.exitReasonDetail.trim()) e.exitReasonDetail = "Please provide exit reason details.";
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
          reason: form.exitReason
        }
      }
    });
    onToast(`Exit request submitted for ${selectedEmp.name}.`);
    setForm({ ...blank });
    setErrors({});
    onToggle();
  }

  return (
    <div className="er-section">
      <div className={`er-form-header${open ? " open" : ""}`} onClick={onToggle}>
        <div className="er-form-header-left">
          <div className="er-form-icon">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <div className="er-form-title">Record Exit Request</div>
            <div className="er-form-sub">Submit a new employee resignation or exit record</div>
          </div>
        </div>
        <svg className={`er-form-chevron${open ? " open" : ""}`} width="16" height="16" fill="none"
          viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="er-form-body">
          <div className="er-form-grid">
            <div>
              <label className="er-label">Employee<span className="er-req">*</span></label>
              <select className={`er-select${errors.empId ? " er-input-error" : ""}`}
                value={form.empId} onChange={(e) => setF("empId", e.target.value)}>
                <option value="">Select Employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                ))}
              </select>
              {errors.empId && <div className="er-error-msg">{errors.empId}</div>}
            </div>
            <div>
              <label className="er-label">Exit Reason<span className="er-req">*</span></label>
              <select className="er-select" value={form.exitReason}
                onChange={(e) => setF("exitReason", e.target.value as ExitReason)}>
                {EXIT_REASONS.map((r: ExitReason) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="er-form-grid-3">
            <div>
              <label className="er-label">Resignation Date<span className="er-req">*</span></label>
              <input type="date" className={`er-input${errors.resignDate ? " er-input-error" : ""}`}
                value={form.resignDate} onChange={(e) => setF("resignDate", e.target.value)}/>
              {errors.resignDate && <div className="er-error-msg">{errors.resignDate}</div>}
            </div>
            <div>
              <label className="er-label">Last Working Day<span className="er-req">*</span></label>
              <input type="date" className={`er-input${errors.lastWorkingDay ? " er-input-error" : ""}`}
                value={form.lastWorkingDay} onChange={(e) => setF("lastWorkingDay", e.target.value)}/>
              {errors.lastWorkingDay && <div className="er-error-msg">{errors.lastWorkingDay}</div>}
            </div>
            <div>
              <label className="er-label">Notice Period (Auto)</label>
              <div className="er-days-badge">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {noticeDays > 0 ? `${noticeDays} days` : "—"}
              </div>
            </div>
          </div>

          <div className="er-form-grid">
            <div>
              <label className="er-label">Reporting Manager</label>
              <input type="text" className="er-input"
                placeholder={selectedEmp ? (selectedEmp.work_detail?.department?.name || "N/A") : "Auto-filled on employee selection"}
                value={form.reportingManager || (selectedEmp ? (selectedEmp.reporting_to_employee ? `${selectedEmp.reporting_to_employee.first_name} ${selectedEmp.reporting_to_employee.last_name}` : "N/A") : "")}
                onChange={(e) => setF("reportingManager", e.target.value)}
                readOnly={!!selectedEmp}/>
            </div>
            <div>
              <label className="er-label">Department</label>
              <input type="text" className="er-input"
                value={selectedEmp ? `${selectedEmp.work_detail?.department?.name || "N/A"} — ${selectedEmp.work_detail?.designation?.name || "N/A"}` : ""}
                readOnly placeholder="Auto-filled on employee selection"/>
            </div>
          </div>

          <div className="er-form-full">
            <label className="er-label">Detailed Reason / Notes<span className="er-req">*</span></label>
            <textarea className={`er-textarea${errors.exitReasonDetail ? " er-input-error" : ""}`}
              placeholder="Describe specific reasons for resignation…"
              value={form.exitReasonDetail}
              onChange={(e) => setF("exitReasonDetail", e.target.value)}/>
            {errors.exitReasonDetail && <div className="er-error-msg">{errors.exitReasonDetail}</div>}
          </div>

          <div className="er-form-actions">
            <button className="er-btn er-btn-outline"
              onClick={() => { setForm({ ...blank }); setErrors({}); onToggle(); }}>
              Cancel
            </button>
            <button className="er-btn er-btn-primary" onClick={handleSubmit}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Submit Exit Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXIT DETAIL DRAWER
───────────────────────────────────────────── */
interface DrawerProps {
  rec: ExitRecord;
  onClose: () => void;
  onApprove: (id: number, remarks: string) => void;
  onReject: (id: number, name: string, remarks: string) => void;
  onRelieve: (id: number) => void;
  onClearanceUpdate: () => void;
  onSettlementToggle: (id: number, key: keyof Settlement) => void;
  onInterviewSave: (id: number, done: boolean, notes: string) => void;
}

function ExitDrawer({
  rec, onClose, onApprove, onReject, onRelieve,
  onClearanceUpdate, onSettlementToggle, onInterviewSave,
}: DrawerProps) {
  const [hrRemarks, setHrRemarks] = useState<string>(rec.hrRemarks);
  const [clearanceRemarks, setClearanceRemarks] = useState<string[]>(
    rec.clearances.map((c: Clearance) => c.remarks)
  );
  const [intDone, setIntDone] = useState<boolean>(rec.exitInterviewDone);
  const [intNotes, setIntNotes] = useState<string>(rec.exitInterviewNotes);

  const approvedCount   = rec.clearances.filter((c: Clearance) => c.status === "Approved").length;
  const totalClearances = rec.clearances.length;
  const clearancePct    = Math.round((approvedCount / totalClearances) * 100);

  const settleKeys: Array<[keyof Settlement, string]> = [
    ["salarySettled",          "Salary Settlement"],
    ["pfSettled",              "PF Settlement"],
    ["gratuitySettled",        "Gratuity Settlement"],
    ["expenseSettled",         "Expense Claims"],
    ["noDuesIssued",           "No Dues Certificate"],
    ["experienceLetterIssued", "Experience Letter"],
  ];
  const settledCount = settleKeys.filter(([k]) => rec.settlement[k]).length;

  const allClear = approvedCount === totalClearances;
  const canRelieve = rec.status === "Clearance In Progress" && allClear && settledCount === settleKeys.length;

  return (
    <>
      <div className="er-overlay" onClick={onClose} />
      <div className="er-drawer">
        <div className="er-drawer-head">
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div className="er-drawer-av" style={{ background: rec.avatarColor }}>
              {getInitials(rec.firstName, rec.lastName)}
            </div>
            <div>
              <div className="er-drawer-name">{rec.firstName} {rec.lastName}</div>
              <div className="er-drawer-sub">{rec.empId} · {rec.department}</div>
              <div style={{ marginTop:6, display:"flex", gap:8, flexWrap:"wrap" }}>
                <StatusBadge status={rec.status} />
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11.5, fontWeight:600, color:"#94a3b8", fontVariantNumeric:"tabular-nums" }}>
                  LWD: {formatDate(rec.lastWorkingDay)}
                </span>
              </div>
            </div>
          </div>
          <button className="er-drawer-close" onClick={onClose}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="er-drawer-scroll">
          <div className="er-drawer-section">
            <div className="er-drawer-section-title">Exit Details</div>
            <div className="er-info-grid">
              <VF label="Designation"       value={rec.designation} />
              <VF label="Reporting Manager" value={rec.reportingManager} />
              <VF label="Joining Date"      value={formatDate(rec.joiningDate)} />
              <VF label="Resignation Date"  value={formatDate(rec.resignDate)} />
              <VF label="Last Working Day"  value={formatDate(rec.lastWorkingDay)} />
              <VF label="Notice Period"     value={`${rec.noticePeriod} days`} />
              <VF label="Exit Reason"       value={rec.exitReason} />
              <VF label="Applied On"        value={formatDate(rec.appliedDate)} />
              {rec.approvedBy && <VF label="Approved By" value={rec.approvedBy} />}
              {rec.approvedOn && <VF label="Approved On" value={formatDate(rec.approvedOn)} />}
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
                <div className="er-progress-fill" style={{ width:`${clearancePct}%` }} />
              </div>
            </div>
            <div className="er-clearance-list" style={{ marginTop:12 }}>
              {rec.clearances.map((cl: Clearance, idx: number) => (
                <div key={cl.dept} className={`er-clearance-item ${cl.status.toLowerCase()}`}>
                  <div className={`er-clearance-icon ${cl.status.toLowerCase()}`}>
                    {cl.status === "Approved" ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="er-clearance-dept">{cl.dept}</div>
                    {cl.clearedBy
                      ? <div className="er-clearance-by">Cleared by {cl.clearedBy} on {formatDate(cl.clearedOn)}</div>
                      : <div className="er-clearance-by">Not yet cleared</div>
                    }
                    {cl.remarks && <div className="er-clearance-remarks">"{cl.remarks}"</div>}
                    {cl.status === "Pending" && rec.status !== "Pending Approval" && rec.status !== "Rejected" && (
                      <div>
                        <input type="text" className="er-clearance-input"
                          placeholder="Add clearance remarks…"
                          value={clearanceRemarks[idx]}
                          onChange={(e) => {
                            const updated = [...clearanceRemarks];
                            updated[idx] = e.target.value;
                            setClearanceRemarks(updated);
                          }}/>
                        <button className="er-clearance-approve-btn"
                          onClick={() => onClearanceUpdate()}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Cleared
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="er-clearance-status">
                    <span className={`er-clearance-pill ${cl.status.toLowerCase()}`}>{cl.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {rec.status !== "Pending Approval" && rec.status !== "Rejected" && (
            <div className="er-drawer-section">
              <div className="er-drawer-section-title">
                Final Settlement ({settledCount}/{settleKeys.length})
              </div>
              <div className="er-settlement-grid">
                {settleKeys.map(([key, label]: [keyof Settlement, string]) => (
                  <div key={key} className={`er-settle-item${rec.settlement[key] ? " done" : ""}`}
                    onClick={() => onSettlementToggle(rec.id, key)}>
                    <div className="er-settle-check">
                      {rec.settlement[key] && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rec.status !== "Pending Approval" && rec.status !== "Rejected" && (
            <div className="er-drawer-section">
              <div className="er-drawer-section-title">Exit Interview</div>
              <div className="er-interview-box">
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div className={`er-settle-item${intDone ? " done" : ""}`}
                    style={{ flex:1, cursor:"pointer" }}
                    onClick={() => setIntDone((v: boolean) => !v)}>
                    <div className="er-settle-check">
                      {intDone && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    Exit Interview Conducted
                  </div>
                </div>
                {intDone && (
                  <textarea className="er-interview-notes"
                    placeholder="Interview notes / feedback summary…"
                    value={intNotes}
                    onChange={(e) => setIntNotes(e.target.value)}/>
                )}
                <button
                  style={{ marginTop:10, height:30, padding:"0 14px", borderRadius:7, border:"1.5px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12.5, fontWeight:600, color:"#334155" }}
                  onClick={() => onInterviewSave(rec.id, intDone, intNotes)}>
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
              <textarea className="er-hr-remarks"
                placeholder="Add HR remarks before approving or rejecting…"
                value={hrRemarks}
                onChange={(e) => setHrRemarks(e.target.value)}/>
            )}
          </div>
        </div>

        <div className="er-drawer-foot">
          {rec.status === "Pending Approval" && (
            <>
              <button className="er-drawer-btn er-drawer-reject"
                onClick={() => onReject(rec.id, `${rec.firstName} ${rec.lastName}`, hrRemarks)}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
              <button className="er-drawer-btn er-drawer-approve"
                onClick={() => onApprove(rec.id, hrRemarks)}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Approve Exit
              </button>
            </>
          )}
          {rec.status === "Clearance In Progress" && (
            <button className="er-drawer-btn er-drawer-relieve"
              style={{ opacity: canRelieve ? 1 : 0.5, cursor: canRelieve ? "pointer" : "not-allowed" }}
              onClick={() => { if (canRelieve) onRelieve(rec.id); }}
              title={canRelieve ? "Mark as Relieved" : "Complete all clearances and settlement first"}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {canRelieve ? "Mark as Relieved" : "Clearances Pending"}
            </button>
          )}
          {(rec.status === "Relieved" || rec.status === "Approved" || rec.status === "Rejected") && (
            <button className="er-drawer-btn er-drawer-neutral" style={{ flex:"unset", width:"100%" }} onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </>
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
      <div className="er-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="er-modal-icon" style={{ background:"#fef2f2", color:"#dc2626" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3>Reject Exit Request?</h3>
        <p>Are you sure you want to reject {name}'s exit request? They will be notified and the request will be closed.</p>
        <div className="er-modal-actions">
          <button className="er-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="er-modal-confirm" style={{ background:"#dc2626" }} onClick={onConfirm}>
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function EmployeeRelieving() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [filters, setFilters] = useState<FilterState>({
    search: "", department: "All", status: "All", dateFrom: "",
  });

  const { data, refetch } = useQuery<any>(GET_RELIEVINGS, {
    variables: {
      pagination: { page: currentPage, limit: itemsPerPage },
      status: filters.status === "All" ? undefined : filters.status,
      // search and department could be added to backend later
    },
    fetchPolicy: "network-only"
  });

  const { data: empData } = useQuery<any>(GET_EMPLOYEES, {
    variables: { pagination: { page: 1, limit: 1000 } }
  });
  const fetchedEmployees = empData?.getAllEmployees?.items || [];

  const [createRelieving] = useMutation(CREATE_RELIEVING, {
    onCompleted: () => {
      showToast("Exit request recorded successfully.");
      refetch();
    },
    onError: (err) => showToast("Error: " + err.message)
  });

  const [updateRelieving] = useMutation(UPDATE_RELIEVING, {
    onCompleted: () => {
      showToast("Exit record updated successfully.");
      refetch();
    }
  });

  const records: ExitRecord[] = useMemo(() => {
    return (data?.relievings?.items || []).map((r: any) => ({
      id: parseInt(r.id),
      empId: r.employee_code || r.employee_id,
      firstName: r.employee?.first_name || "Unknown",
      lastName: r.employee?.last_name || "",
      department: r.employee?.work_detail?.department?.name || "N/A",
      designation: r.employee?.work_detail?.designation?.name || "N/A",
      avatarColor: "#6366f1", // Default color
      officialEmail: "N/A",
      phone: "N/A",
      reportingManager: "N/A",
      joiningDate: "N/A",
      resignDate: r.resignation_date,
      lastWorkingDay: r.last_working_date,
      noticePeriod: r.notice_period_days,
      exitReason: r.reason || "Other",
      exitReasonDetail: r.remarks || "",
      status: r.status,
      appliedDate: r.created_at || "",
      approvedBy: "N/A",
      approvedOn: "N/A",
      hrRemarks: r.remarks || "",
      clearances: [],
      settlement: {
        salarySettled: false, pfSettled: false, gratuitySettled: false,
        expenseSettled: false, noDuesIssued: false, experienceLetterIssued: false
      },
      exitInterviewDone: r.exit_interview_done || false,
      exitInterviewNotes: r.remarks || ""
    }));
  }, [data]);

  const pageInfo = data?.relievings?.pageInfo;
  const totalPages = pageInfo?.totalPages || 1;
  const totalCount = pageInfo?.totalCount || 0;

  const [sortField, setSortField] = useState<SortField>("resignDate");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [drawerRec, setDrawerRec] = useState<ExitRecord | null>(null);
  const [formOpen, setFormOpen]   = useState<boolean>(false);
  const [toast, setToast]         = useState<string>("");
  const [rejectTarget, setRejectTarget] = useState<{ id: any; name: string; remarks: string } | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }

  /* Filtered + sorted */
  const filtered = useMemo<ExitRecord[]>(() => {
    let list = [...records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((r: ExitRecord) =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q)
      );
    }
    if (filters.department !== "All")
      list = list.filter((r: ExitRecord) => r.department === filters.department);
    if (filters.status !== "All")
      list = list.filter((r: ExitRecord) => r.status === filters.status);
    if (filters.dateFrom)
      list = list.filter((r: ExitRecord) => r.lastWorkingDay >= filters.dateFrom);

    list.sort((a: ExitRecord, b: ExitRecord) => {
      let va = "", vb = "";
      if (sortField === "name")       { va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; }
      if (sortField === "empId")      { va = a.empId;      vb = b.empId; }
      if (sortField === "department") { va = a.department; vb = b.department; }
      if (sortField === "resignDate") { va = a.resignDate; vb = b.resignDate; }
      if (sortField === "lastDay")    { va = a.lastWorkingDay; vb = b.lastWorkingDay; }
      if (sortField === "status")     { va = a.status;     vb = b.status; }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [records, filters, sortField, sortDir]);

  /* Stats */
  const stats = useMemo(() => ({
    total:    records.length,
    pending:  records.filter((r: ExitRecord) => r.status === "Pending Approval").length,
    clearance:records.filter((r: ExitRecord) => r.status === "Clearance In Progress" || r.status === "Approved").length,
    relieved: records.filter((r: ExitRecord) => r.status === "Relieved").length,
  }), [records]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function setFilter<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    setFilters((prev: FilterState) => ({ ...prev, [key]: val }));
  }

  /* Approve */
  function handleApprove(id: number, remarks: string) {
    updateRelieving({
      variables: {
        id: id.toString(),
        input: { status: "Approved", remarks }
      }
    });
    if (drawerRec?.id === id) setDrawerRec(null);
    showToast("Exit request approved. Clearance process initiated.");
  }

  /* Reject */
  function initiateReject(id: number, name: string, remarks: string) {
    setRejectTarget({ id, name, remarks });
  }
  function confirmReject() {
    if (!rejectTarget) return;
    updateRelieving({
      variables: {
        id: rejectTarget.id.toString(),
        input: { status: "Rejected", remarks: rejectTarget.remarks }
      }
    });
    if (drawerRec?.id === rejectTarget.id) setDrawerRec(null);
    showToast("Exit request rejected.");
    setRejectTarget(null);
  }

  /* Relieve */
  function handleRelieve(id: number) {
    updateRelieving({
      variables: {
        id: id.toString(),
        input: { status: "Relieved" }
      }
    });
    if (drawerRec?.id === id) setDrawerRec(null);
    showToast("Employee marked as Relieved. All clearances complete.");
  }

  /* Clearance update */
  function handleClearanceUpdate() {
    showToast(`Clearance approved successfully.`);
  }

  /* Settlement toggle */
  function handleSettlementToggle(id: number, key: keyof Settlement) {
    // For now, no specific backend field for this, but can map to assets_returned if it fits
    if (key === 'noDuesIssued') {
       updateRelieving({ variables: { id: id.toString(), input: { assets_returned: true } } });
    }
  }

  /* Interview save */
  function handleInterviewSave(id: number, done: boolean, notes: string) {
    updateRelieving({
      variables: {
        id: id.toString(),
        input: { exit_interview_done: done, remarks: notes }
      }
    });
    showToast("Exit interview status saved.");
  }

  /* ── RENDER ── */
  return (
    <div className="er-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div className="er-header">
        <div>
          <h1 className="er-title">Employee Relieving</h1>
          <p className="er-sub">Manage employee exits, resignation approvals, clearances, and final settlements.</p>
        </div>
        <div className="er-header-actions">
          <button className="er-header-btn" onClick={() => showToast("Exit report exported.")}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
          <button className="er-header-btn er-header-btn-primary"
            onClick={() => setFormOpen((v: boolean) => !v)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Record Exit
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="er-stats">
        {([
          { label:"Total Exit Requests",   value:stats.total,     sub:"All time",              color:"#1d4ed8", bg:"#eff6ff" },
          { label:"Pending Approvals",     value:stats.pending,   sub:"Awaiting HR decision",  color:"#b45309", bg:"#fffbeb" },
          { label:"Clearance In Progress", value:stats.clearance, sub:"In exit process",        color:"#1d4ed8", bg:"#eff6ff" },
          { label:"Employees Relieved",    value:stats.relieved,  sub:"Successfully exited",   color:"#059669", bg:"#f0fdf4" },
        ] as const).map((s) => (
          <div key={s.label} className="er-stat-card">
            <div className="er-stat-icon" style={{ background: s.bg }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={s.color} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <div className="er-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="er-stat-lbl">{s.label}</div>
              <div className="er-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <ExitForm
        open={formOpen}
        onToggle={() => setFormOpen((v: boolean) => !v)}
        onToast={showToast}
        employees={fetchedEmployees}
        createRelieving={createRelieving}
      />

      {/* Table Section */}
      <div className="er-section">

        {/* Filter Bar — single date filter for Relieving Date */}
        <div className="er-filter-bar">
          <div className="er-search-wrap">
            <span className="er-search-icon">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </span>
            <input className="er-search" placeholder="Search name or ID…"
              value={filters.search} onChange={(e) => setFilter("search", e.target.value)}/>
          </div>

          <div className="er-filter-divider" />

          <select className="er-filter-sel" value={filters.department}
            onChange={(e) => setFilter("department", e.target.value)}>
            {DEPARTMENTS.map((d: string) => (
              <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
            ))}
          </select>

          <select className="er-filter-sel" value={filters.status}
            onChange={(e) => setFilter("status", e.target.value as FilterState["status"])}>
            <option value="All">All Status</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Clearance In Progress">Clearance In Progress</option>
            <option value="Relieved">Relieved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input type="date" className="er-filter-date"
            value={filters.dateFrom}
            onChange={(e) => setFilter("dateFrom", e.target.value)}/>

          <span className="er-filter-count">{filtered.length} of {records.length} records</span>
        </div>

        {/* Table — columns: Emp ID | Employee | Department | Designation | Relieving Date | Status | Actions */}
        <div className="er-table-wrap">
          {filtered.length === 0 ? (
            <div className="er-empty">
              <div className="er-empty-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <p>No exit records found</p>
              <span>Try adjusting the filters or record a new exit.</span>
            </div>
          ) : (
            <table className="er-table">
              <thead>
                <tr>
                  <SortTh field="empId"      label="Emp ID"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="name"        label="Employee"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="department"  label="Department"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th>Designation</th>
                  <SortTh field="lastDay"     label="Relieving Date"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <SortTh field="status"      label="Status"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <th style={{ textAlign:"center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec: ExitRecord, idx: number) => (
                  <tr key={rec.id} className={idx < 5 ? "er-row-in" : ""}>

                    {/* Emp ID — Inter */}
                    <td>
                      <span className="er-emp-id">{rec.empId}</span>
                    </td>

                    {/* Employee Name */}
                    <td>
                      <div className="er-emp-cell">
                        <div className="er-emp-av" style={{ background: rec.avatarColor }}>
                          {getInitials(rec.firstName, rec.lastName)}
                        </div>
                        <div>
                          <div className="er-emp-name">{rec.firstName} {rec.lastName}</div>
                          <div className="er-emp-sub">{rec.officialEmail}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td><span className="er-dept-pill">{rec.department}</span></td>

                    {/* Designation */}
                    <td><span className="er-desig">{rec.designation}</span></td>

                    {/* Relieving Date — Inter */}
                    <td><span className="er-date-val">{formatDate(rec.lastWorkingDay)}</span></td>

                    {/* Status */}
                    <td><StatusBadge status={rec.status} /></td>

                    {/* Actions — 3-dot menu */}
                    <td style={{ textAlign:"center" }}>
                      <DotsMenu
                        rec={rec}
                        onView={() => setDrawerRec(rec)}
                        onApprove={() => handleApprove(rec.id, "")}
                        onReject={() => initiateReject(rec.id, `${rec.firstName} ${rec.lastName}`, "")}
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
          <div className="lv-pagination">
            <div className="lv-pag-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
            <div className="lv-pag-btns">
              <button 
                className="lv-pag-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  className={`lv-pag-btn ${p === currentPage ? 'active' : ''}`} 
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button 
                className="lv-pag-btn" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
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
          onApprove={(id: number, remarks: string) => { handleApprove(id, remarks); }}
          onReject={(id: number, name: string, remarks: string) => {
            initiateReject(id, name, remarks);
            setDrawerRec(null);
          }}
          onRelieve={(id: number) => { handleRelieve(id); }}
          onClearanceUpdate={handleClearanceUpdate}
          onSettlementToggle={handleSettlementToggle}
          onInterviewSave={handleInterviewSave}
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

      {/* Toast */}
      {toast && (
        <div className="er-toast">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
