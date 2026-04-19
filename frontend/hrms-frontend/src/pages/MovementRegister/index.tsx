// src/pages/MovementRegister.tsx

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_MOVEMENTS,
  CREATE_MOVEMENT,
  UPDATE_MOVEMENT,
} from "../../graphql/movementQueries";
import { GET_EMPLOYEES } from "../../graphql/employeeQueries";
import { GET_SETTINGS } from "../../graphql/settingsQueries";
import AnalogTimePicker from "../../components/AnalogTimePicker";
import { isAdmin, hasRole, isHod } from "../../utils/auth";

// Sections
import MovementHeaderSection from "./components/sections/MovementHeaderSection";
import MovementFilterSection from "./components/sections/MovementFilterSection";
import MovementTableSection from "./components/sections/MovementTableSection";
import MovementPaginationSection from "./components/sections/MovementPaginationSection";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type MvStatus = "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";
type SortField = "empId" | "empName" | "date" | "status";
type SortDir = "asc" | "desc";
type MvReason =
  | "Exam Duty"
  | "Bank Visit"
  | "Medical Appointment"
  | "Outside Meeting"
  | "Personal Emergency"
  | "Official Field Work"
  | "Government Office"
  | "Other";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  work_detail?: {
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
}

interface MovementRecord {
  id: string;
  employee_id: string;
  employee_code: string;
  movement_type: string;
  from_location: string;
  to_location: string;
  purpose: string;
  movement_date: string;
  out_time: string;
  in_time: string;
  status: MvStatus;
  dept_admin_status: MvStatus;
  dept_admin_remarks: string;
  admin_status: MvStatus;
  admin_remarks: string;
  remarks: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
    employee_image: string;
    work_detail?: {
      department: { id: string; name: string };
      designation: { id: string; name: string };
    };
  };
}

interface FilterState {
  search: string;
  month: string; // YYYY-MM
  department: string;
  status: MvStatus | "All";
}

interface FormState {
  empId: string;
  date: string;
  outTime: string;
  returnTime: string;
  reason: MvReason;
  reasonDetail: string;
}

interface FormErrors {
  empId?: string;
  date?: string;
  outTime?: string;
  returnTime?: string;
  reasonDetail?: string;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const MV_REASONS: MvReason[] = [
  "Exam Duty",
  "Bank Visit",
  "Medical Appointment",
  "Outside Meeting",
  "Personal Emergency",
  "Official Field Work",
  "Government Office",
  "Other",
];

const getTodayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
};

const TODAY = getTodayStr();

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function initials(first: string, last: string): string {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function to12(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function timeRange(out: string, ret: string): string {
  if (!out) return "—";
  return `${to12(out)} - ${ret ? to12(ret) : "..."}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = d.getDate();
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return iso;
  }
}

function tdiff(a: string, b: string): string {
  if (!a || !b) return "—";
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  const d = bh * 60 + bm - (ah * 60 + am);
  if (d <= 0) return "—";
  return Math.floor(d / 60) > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : `${d}m`;
}

/* ─────────────────────────────────────────────
   CSS  (matches reference screenshot closely)
───────────────────────────────────────────── */
const CSS = `
  /* page */
  .mr-h1  { font-size:24px; font-weight:700; color:#111827; margin-bottom:4px; letter-spacing:-.3px; }
  .mr-sub { font-size:13.5px; color:#6b7280; margin-bottom:24px; }

  /* ── Filter Bar ── */
  .mr-filter-bar {
    display:flex; align-items:center; flex-wrap:nowrap;
    gap:8px; padding:13px 18px; border-bottom:1px solid #f1f5f9;
  }
  .mr-search-wrap { position:relative; flex:0 0 200px; }
  .mr-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
  .mr-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#fafafa; outline:none; transition:border-color .14s;
  }
  .mr-search::placeholder { color:#94a3b8; }
  .mr-search:focus { border-color:#4f46e5; background:#fff; box-shadow:0 0 0 3px rgba(79,70,229,.09); }

  .mr-filter-sel {
    height:36px; padding:0 26px 0 10px; border:1.5px solid #e2e8f0;
    border-radius:8px; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; color:#334155; background:#fafafa;
    outline:none; cursor:pointer; flex-shrink:0;
    -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 9px center;
    transition:border-color .14s;
  }
  .mr-filter-sel:focus { border-color:#4f46e5; background:#fff; }
  .mr-filter-divider { width:1px; height:22px; background:#e2e8f0; flex-shrink:0; }
  .mr-filter-count   { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#64748b; white-space:nowrap; margin-left:auto; flex-shrink:0; }

  /* refresh */
  .mr-refresh {
    height:40px; padding:0 14px; border:1px solid #d1d5db; border-radius:8px;
    background:#fff; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;
    color:#374151; cursor:pointer; display:flex; align-items:center; gap:6px;
    flex-shrink:0; transition:background .12s;
  }
  .mr-refresh:hover { background:#f9fafb; }

  /* add button */
  .mr-add {
    height:40px; padding:0 18px; border:none; border-radius:8px;
    background:#4f46e5; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600;
    cursor:pointer; display:flex; align-items:center; gap:6px; flex-shrink:0;
    box-shadow:0 1px 3px rgba(79,70,229,.35); transition:background .12s;
  }
  .mr-add:hover { background:#4338ca; }

  /* table card — plain white with a light border, just like screenshot */
  .mr-card {
    background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04);
  }
  .mr-table-wrap { overflow-x:auto; }
  table.mr-table { width:100%; border-collapse:collapse; }

  .mr-table thead tr { border-bottom:1px solid #e5e7eb; }
  .mr-table th {
    padding:14px 20px; text-align:left;
    font-size:13px; font-weight:600; color:#374151;
    white-space:nowrap; cursor:pointer; user-select:none;
    background:#fff;
  }
  .mr-table th:hover { color:#4f46e5; }
  .mr-table th.mr-sorted { color:#4f46e5; }
  .mr-th-i { display:flex; align-items:center; gap:4px; }

  .mr-table tbody tr { border-bottom:1px solid #f3f4f6; transition:background .08s; cursor:pointer; }
  .mr-table tbody tr:last-child { border-bottom:none; }
  .mr-table tbody tr:hover { background:#f9fafb; }
  .mr-table td { padding:15px 20px; vertical-align:middle; }

  /* cells */
  .mr-empid  { font-size:13.5px; color:#111827; font-weight:600; font-family:'DM Sans',sans-serif; }
  .mr-name   { font-size:13.5px; color:#111827; font-weight:500; font-family:'DM Sans',sans-serif; }
  .mr-date   { font-size:13.5px; color:#374151; white-space:nowrap; font-family:'DM Sans',sans-serif; }
  .mr-time   { font-size:13.5px; color:#374151; white-space:nowrap; font-family:'DM Sans',sans-serif; }
  .mr-reason { font-size:13.5px; color:#374151; font-family:'DM Sans',sans-serif; }

  /* status — pill with dot, matching leave management */
  .mr-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3.5px 10px; border-radius:99px;
    font-size:11px; font-weight:700; white-space:nowrap;
    letter-spacing: .02em; font-family:'DM Sans',sans-serif;
  }
  .mr-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; opacity:.75; }
  .mr-badge-pending   { background:#fef3c7; color:#92400e; }
  .mr-badge-approved  { background:#dcfce7; color:#166534; }
  .mr-badge-rejected  { background:#fee2e2; color:#991b1b; }
  .mr-badge-completed { background:#dbeafe; color:#1e40af; }
  .mr-badge-cancelled { background:#f8fafc; color:#64748b; border: 1px solid #e2e8f0; font-size: 10px; padding: 2px 8px; }

  /* empty */
  .mr-empty { padding:64px 24px; text-align:center; }
  .mr-empty-ic { width:50px; height:50px; border-radius:12px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#9ca3af; }
  .mr-empty p  { font-size:15px; font-weight:600; color:#6b7280; margin-bottom:4px; }
  .mr-empty s2 { font-size:13px; color:#9ca3af; display:block; }

  /* ── Drawer ── */
  .mr-ov { position:fixed; inset:0; background:rgba(17,24,39,.3); z-index:100; animation:mrFd .18s ease both; }
  @keyframes mrFd { from{opacity:0} to{opacity:1} }
  .mr-dr {
    position:fixed; top:0; right:0; bottom:0; width:480px; background:#fff; z-index:101;
    box-shadow:-4px 0 24px rgba(0,0,0,.1); animation:mrSl .22s cubic-bezier(.16,1,.3,1) both;
    display:flex; flex-direction:column; overflow:hidden;
  }
  @keyframes mrSl { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .mr-dr-hd {
    display:flex; align-items:flex-start; justify-content:space-between;
    padding:20px 24px 16px; border-bottom:1px solid #f3f4f6; flex-shrink:0;
  }
  .mr-dr-av  { width:46px; height:46px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:#fff; }
  .mr-dr-nm  { font-size:16px; font-weight:700; color:#111827; }
  .mr-dr-mt  { font-family:'DM Sans',sans-serif; font-size:12px; color:#9ca3af; margin-top:2px; }
  .mr-dr-x   { width:34px; height:34px; border-radius:8px; border:1.5px solid #d1d5db; background:#f9fafb; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#1f2937; flex-shrink:0; }
  .mr-dr-x:hover { background:#f3f4f6; color:#000; border-color:#9ca3af; }
  .mr-dr-bd  { flex:1; overflow-y:auto; padding:20px 24px 24px; }
  .mr-sec    { margin-bottom:22px; }
  .mr-sec-t  { font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:700; color:#4f46e5; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #eef2ff; }
  .mr-grid2  { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .mr-fi label { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#94a3b8; display:block; margin-bottom:3px; }
  .mr-fi span  { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#111827; font-weight:500; display:block; }
  .mr-fi-num span { font-family:'DM Sans',sans-serif; font-weight:700; }
  .mr-desc-box { padding:12px 14px; background:#f8fafc; border:1px solid #e8edf5; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#334155; line-height:1.55; }

  /* time blocks */
  .mr-tv { display:flex; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
  .mr-tv-b { flex:1; padding:15px 17px; text-align:center; background:#fff; }
  .mr-tv-b + .mr-tv-b { border-left:1px solid #e2e8f0; }
  .mr-tv-lbl { font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:600; color:#94a3b8; letter-spacing:.05em; text-transform:uppercase; margin-bottom:4px; }
  .mr-tv-t   { font-family:'DM Sans',sans-serif; font-size:20px; font-weight:700; }
  .mr-tv-n   { font-family:'DM Sans',sans-serif; font-size:11.5px; color:#94a3b8; margin-top:3px; }

  /* log return */
  .mr-rl { background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:14px 16px; }
  .mr-rl-t { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; color:#7c3aed; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .mr-rl-row { display:flex; gap:8px; }
  .mr-rl-in {
    flex:1; height:36px; padding:0 10px; border:1.5px solid #ddd6fe; border-radius:7px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; color:#111827;
    background:#fff; outline:none; -webkit-appearance:none; appearance:none;
  }
  .mr-rl-in:focus { border-color:#7c3aed; }
  .mr-rl-btn {
    height:36px; padding:0 14px; border-radius:7px; border:none;
    background:#7c3aed; color:#fff; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;
  }
  .mr-rl-btn:hover { background:#6d28d9; }

  /* remarks/actions */
  .mr-rem {
    width:100%; height:80px; padding:9px 12px; border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; resize:none; transition:border-color .14s;
    margin-top: 8px;
  }
  .mr-rem:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09); }

  /* drawer footer */
  .mr-dr-ft { display:flex; gap:10px; padding:16px 24px; border-top:1px solid #f1f5f9; flex-shrink:0; background:#fafbfe; }
  .mr-dr-btn {
    flex:1; height:38px; border-radius:8px; border:none;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all .13s;
  }
  .mr-dr-approve { background:#15803d; color:#fff; box-shadow:0 2px 6px rgba(21,128,61,.25); }
  .mr-dr-approve:hover { background:#166534; }
  .mr-dr-reject  { background:#fff; color:#dc2626; border:1.5px solid #fecaca !important; }
  .mr-dr-reject:hover { background:#fef2f2; }
  .mr-dr-close   { background:#fff; color:#64748b; border:1.5px solid #e2e8f0 !important; }
  .mr-dr-close:hover { background:#f1f5f9; }

  /* drawer actions */
  .mr-dr-actions { position:relative; }
  .mr-dr-dots { 
    width:34px; height:34px; border-radius:8px; border:1.5px solid #d1d5db; background:#f9fafb; 
    display:flex; align-items:center; justify-content:center; cursor:pointer; color:#1f2937; transition:0.2s;
  }
  .mr-dr-dots:hover { background:#f3f4f6; color:#000; border-color:#9ca3af; }
  .mr-dr-menu {
    position:absolute; right:0; top:40px; background:#fff; border:1px solid #e2e8f0; border-radius:10px;
    box-shadow:0 10px 30px rgba(0,0,0,0.15); width:170px; z-index:100; padding:6px; animation:mrMu .14s ease;
  }
  .mr-dr-item {
    display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:6px;
    font-size:13px; font-weight:600; color:#475569; cursor:pointer; transition:0.15s;
  }
  .mr-dr-item:hover { background:#f1f5f9; color:#1d4ed8; }
  .mr-dr-item.mr-dr-danger { color:#dc2626; }
  .mr-dr-item.mr-dr-danger:hover { background:#fef2f2; color:#b91c1c; }
  .mr-dr-item svg { opacity:0.7; }

  .mr-edit-box {
    background:#fff; border:1.5px solid #4f46e5; border-radius:12px; padding:16px; margin-bottom:16px;
    box-shadow:0 4px 12px rgba(79,70,229,0.1);
  }
  .mr-edit-hd { font-size:12px; font-weight:700; color:#4f46e5; text-transform:uppercase; margin-bottom:12px; letter-spacing:0.02em; }
  .mr-edit-f { display:flex; gap:12px; margin-bottom:12px; }
  .mr-edit-f > div { flex:1; }
  .mr-edit-btns { display:flex; gap:8px; }
  .mr-edit-btn { height:32px; padding:0 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; transition:0.2s; }
  .mr-edit-save { background:#4f46e5; color:#fff; border:none; }
  .mr-edit-save:hover { background:#4338ca; }
  .mr-edit-cancel { background:#f1f5f9; color:#475569; border:none; }
  .mr-edit-cancel:hover { background:#e2e8f0; }

  /* ── Modal ── */
  .mr-mo { position:fixed; inset:0; background:rgba(17,24,39,.4); z-index:200; display:flex; align-items:center; justify-content:center; animation:mrFd .16s ease both; }
  .mr-mi { background:#fff; border-radius:14px; width:500px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,.18); animation:mrMu .2s cubic-bezier(.16,1,.3,1) both; }
  @keyframes mrMu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .mr-mi-h { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid #f3f4f6; }
  .mr-mi-t { font-size:16px; font-weight:700; color:#111827; }
  .mr-mi-x { width:28px; height:28px; border-radius:6px; border:1px solid #e5e7eb; background:#f9fafb; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#6b7280; }
  .mr-mi-x:hover { background:#f3f4f6; }
  .mr-mi-b { padding:18px 22px; }
  .mr-mi-f { display:flex; gap:10px; padding:14px 22px 18px; border-top:1px solid #f3f4f6; }
  .mr-mi-btn { flex:1; height:38px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; cursor:pointer; }
  .mr-mi-pri { background:#4f46e5; color:#fff; border:none; }
  .mr-mi-pri:hover { background:#4338ca; }
  .mr-mi-out { background:#fff; color:#6b7280; border:1px solid #e5e7eb; }
  .mr-mi-out:hover { background:#f9fafb; }

  .mr-ferr   { border-color:#ef4444 !important; background:#fef2f2; }
  .mr-errt   { font-size:11px; color:#ef4444; margin-top:3px; font-weight:600; }

  /* form elements */
  .mr-fg2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
  .mr-fg4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:12px; }
  .mr-ff  { margin-bottom:12px; }
  .mr-lbl { font-size:12px; font-weight:600; color:#374151; margin-bottom:5px; display:block; }
  .mr-req { color:#ef4444; }
  .mr-time-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    background: #fff;
    cursor: pointer;
    transition: all 0.1s;
  }
  .mr-time-trigger:hover {
    border-color: #4f46e5;
  }
  .mr-time-trigger svg { color: #9ca3af; }
  .mr-time-trigger.err { border-color: #ef4444; background: #fef2f2; }

  .mr-inp, .mr-sel2, .mr-ta {
    width:100%; height:36px; padding:0 12px; border:1px solid #d1d5db; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; color:#111827; background:#fff;
    outline:none; -webkit-appearance:none; appearance:none; transition:border-color .14s;
  }
  .mr-sel2 {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:30px; cursor:pointer;
  }
  .mr-ta  { height:68px; padding:8px 12px; resize:none; }
  .mr-inp:focus,.mr-sel2:focus,.mr-ta:focus { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.09); }
  .mr-ferr { border-color:#ef4444 !important; }
  .mr-errt { font-size:11px; color:#ef4444; margin-top:3px; }
  .mr-dur  {
    display:inline-flex; align-items:center; gap:5px; height:36px; padding:0 12px;
    border-radius:8px; background:#eef2ff; border:1px solid #c7d2fe;
    font-size:13px; font-weight:700; color:#4f46e5;
  }

  /* toast */
  .mr-toast {
    position:fixed; bottom:26px; right:26px; background:#111827; color:#fff;
    padding:11px 17px; border-radius:10px; font-size:13.5px; font-weight:500;
    display:flex; align-items:center; gap:9px;
    box-shadow:0 8px 24px rgba(0,0,0,.18); z-index:9999;
    animation:mrTs .3s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes mrTs { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function StatusCell({ status }: { status?: string }) {
  const s = (status || "Pending").trim();
  const low = s.toLowerCase();

  switch (low) {
    case "approved":
      return <span className="mr-badge mr-badge-approved">Approved</span>;
    case "rejected":
      return <span className="mr-badge mr-badge-rejected">Rejected</span>;
    case "completed":
      return <span className="mr-badge mr-badge-completed">Completed</span>;
    case "cancelled":
      return <span className="mr-badge mr-badge-cancelled">Cancelled</span>;
    default:
      return <span className="mr-badge mr-badge-pending">{s}</span>;
  }
}

interface DFP {
  label: string;
  value: string;
  num?: boolean;
}
function DF({ label, value, num }: DFP) {
  return (
    <div className={`mr-fi${num ? " mr-fi-num" : ""}`}>
      <label>{label}</label>
      <span>{value || "—"}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NEW REQUEST MODAL
───────────────────────────────────────────── */
interface ModalP {
  onClose: () => void;
  onToast: (m: string) => void;
}
function NewModal({ onClose, onToast }: ModalP) {
  const { data: empData } = useQuery<{
    getAllEmployees: { items: Employee[] };
  }>(GET_EMPLOYEES);
  const [createMovement] = useMutation(CREATE_MOVEMENT, {
    refetchQueries: ["GetMovements"],
    onCompleted: () => onToast("Movement request submitted successfully."),
    onError: (err) => onToast("Error: " + err.message),
  });

  const employees = empData?.getAllEmployees?.items || [];
  const blank: FormState = {
    empId: "",
    date: TODAY,
    outTime: "",
    returnTime: "",
    reason: "Exam Duty",
    reasonDetail: "",
  };
  const [form, setForm] = useState<FormState>({ ...blank });
  const [errs, setErrs] = useState<FormErrors>({});
  const [showOut, setShowOut] = useState(false);
  const [showRet, setShowRet] = useState(false);

  const selectedEmp = employees.find(
    (e: Employee) => e.employee_id === form.empId,
  );
  const dur = tdiff(form.outTime, form.returnTime);

  function f<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p: FormState) => ({ ...p, [k]: v }));
    setErrs((p: FormErrors) => ({ ...p, [k]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.empId) e.empId = "Required.";
    if (!form.date) e.date = "Required.";
    else {
      const d = new Date(form.date);
      if (d.getDay() === 0) e.date = "Sundays are not allowed.";
    }
    if (!form.outTime) e.outTime = "Required.";
    if (!form.returnTime) e.returnTime = "Required.";
    if (form.outTime && form.returnTime && form.returnTime <= form.outTime)
      e.returnTime = "Must be after out time.";

    // Duration Limit Check (1 hour / 60 mins)
    if (form.outTime && form.returnTime) {
      const [oh, om] = form.outTime.split(":").map(Number);
      const [ih, im] = form.returnTime.split(":").map(Number);
      const diff = ih * 60 + im - (oh * 60 + om);
      if (diff > 60) e.returnTime = "Max duration is 1 hour (60 mins).";
    }

    if (!form.reasonDetail.trim()) e.reasonDetail = "Required.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate() || !selectedEmp) return;

    createMovement({
      variables: {
        input: {
          employee_id: selectedEmp.id,
          employee_code: selectedEmp.employee_id,
          movement_type: form.reason,
          movement_date: form.date,
          out_time: form.outTime,
          in_time: form.returnTime,
          purpose: form.reasonDetail,
        },
      },
    });
    onClose();
  }

  return (
    <div className="mr-mo" onClick={onClose}>
      <div
        className="mr-mi"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="mr-mi-h">
          <span className="mr-mi-t">New Movement Request</span>
          <button className="mr-mi-x" onClick={onClose}>
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mr-mi-b">
          <div className="mr-fg2">
            <div>
              <label className="mr-lbl">
                Employee <span className="mr-req">*</span>
              </label>
              <select
                className={`mr-sel2${errs.empId ? " mr-ferr" : ""}`}
                value={form.empId}
                onChange={(e) => f("empId", e.target.value)}
              >
                <option value="">Select Employee…</option>
                {employees.map((e: Employee) => (
                  <option key={e.id} value={e.employee_id}>
                    {e.first_name} {e.last_name} ({e.employee_id})
                  </option>
                ))}
              </select>
              {errs.empId && <div className="mr-errt">{errs.empId}</div>}
            </div>
            <div>
              <label className="mr-lbl">
                Reason <span className="mr-req">*</span>
              </label>
              <select
                className="mr-sel2"
                value={form.reason}
                onChange={(e) => f("reason", e.target.value as MvReason)}
              >
                {MV_REASONS.map((r: MvReason) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mr-fg4">
            <div>
              <label className="mr-lbl">
                Date <span className="mr-req">*</span>
              </label>
              <input
                type="date"
                className={`mr-inp${errs.date ? " mr-ferr" : ""}`}
                value={form.date}
                onChange={(e) => f("date", e.target.value)}
              />
              {errs.date && <div className="mr-errt">{errs.date}</div>}
            </div>
            <div>
              <label className="mr-lbl">
                Out Time <span className="mr-req">*</span>
              </label>
              <div
                className={`mr-time-trigger${errs.outTime ? " err" : ""}`}
                onClick={() => setShowOut(true)}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {to12(form.outTime)}
              </div>
              {errs.outTime && <div className="mr-errt">{errs.outTime}</div>}
              {showOut && (
                <AnalogTimePicker
                  initialTime={form.outTime || "09:00"}
                  onSave={(t: string) => {
                    f("outTime", t);
                    setShowOut(false);
                  }}
                  onCancel={() => setShowOut(false)}
                />
              )}
            </div>
            <div>
              <label className="mr-lbl">
                Return By <span className="mr-req">*</span>
              </label>
              <div
                className={`mr-time-trigger${errs.returnTime ? " err" : ""}`}
                onClick={() => setShowRet(true)}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {to12(form.returnTime)}
              </div>
              {errs.returnTime && (
                <div className="mr-errt">{errs.returnTime}</div>
              )}
              {showRet && (
                <AnalogTimePicker
                  initialTime={form.returnTime || "10:00"}
                  onSave={(t: string) => {
                    f("returnTime", t);
                    setShowRet(false);
                  }}
                  onCancel={() => setShowRet(false)}
                />
              )}
            </div>
            <div>
              <label className="mr-lbl">Duration</label>
              <div className="mr-dur">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {dur}
              </div>
            </div>
          </div>
          <div className="mr-fg2">
            <div>
              <label className="mr-lbl">Department</label>
              <input
                className="mr-inp"
                value={selectedEmp?.work_detail?.department?.name || "N/A"}
                readOnly
                style={{ background: "#f9fafb", color: "#6b7280" }}
              />
            </div>
            <div>
              <label className="mr-lbl">Designation</label>
              <input
                className="mr-inp"
                value={selectedEmp?.work_detail?.designation?.name || "N/A"}
                readOnly
                style={{ background: "#f9fafb", color: "#6b7280" }}
              />
            </div>
          </div>
          <div className="mr-ff">
            <label className="mr-lbl">
              Details <span className="mr-req">*</span>
            </label>
            <textarea
              className={`mr-ta${errs.reasonDetail ? " mr-ferr" : ""}`}
              placeholder="Describe the purpose of this movement…"
              value={form.reasonDetail}
              onChange={(e) => f("reasonDetail", e.target.value)}
            />
            {errs.reasonDetail && (
              <div className="mr-errt">{errs.reasonDetail}</div>
            )}
          </div>
        </div>
        <div className="mr-mi-f">
          <button className="mr-mi-btn mr-mi-out" onClick={onClose}>
            Cancel
          </button>
          <button className="mr-mi-btn mr-mi-pri" onClick={submit}>
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETAIL DRAWER
───────────────────────────────────────────── */
interface DrP {
  rec: MovementRecord;
  onClose: () => void;
  onToast: (m: string) => void;
  initialIsEditing?: boolean;
}
function Drawer({
  rec,
  onClose,
  onToast,
  initialIsEditing,
  onUpdate,
}: DrP & {
  onUpdate: (vars: {
    variables: {
      id: string;
      input: {
        status?: string;
        admin_status?: string;
        dept_admin_status?: string;
        remarks?: string;
        admin_remarks?: string;
        dept_admin_remarks?: string;
        in_time?: string;
        out_time?: string;
      };
    };
  }) => void;
}) {
  const [deptRem, setDeptRem] = useState("");
  const [adminRem, setAdminRem] = useState("");
  const [ret, setRet] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(initialIsEditing || false);
  const [editOut, setEditOut] = useState(rec.out_time);
  const [editRet, setEditRet] = useState(rec.in_time);
  const [showOutP, setShowOutP] = useState(false);
  const [showRetP, setShowRetP] = useState(false);

  // For UI logic, in_time is treated as actual return if status is Completed
  const isCompleted = rec.status === "Completed";
  const actualReturn = isCompleted ? rec.in_time : "";
  const expectedReturn = rec.in_time; // Reusing in_time for expected return range
  const late = actualReturn && actualReturn > expectedReturn;

  function handleAction(
    role: "HOD" | "ADMIN",
    status: MvStatus,
    remarks?: string,
    actualRet?: string,
  ) {
    const input: {
      remarks: string;
      in_time?: string;
      status?: string;
      dept_admin_status?: string;
      dept_admin_remarks?: string;
      admin_status?: string;
      admin_remarks?: string;
    } = {
      remarks: remarks || (role === "HOD" ? deptRem : adminRem),
      ...(actualRet && { in_time: actualRet }),
    };

    if (status === "Completed") {
      input.status = "completed";
      if (role === "HOD") input.dept_admin_remarks = remarks || deptRem;
      else input.admin_remarks = remarks || adminRem;
    } else {
      if (role === "HOD") {
        input.dept_admin_status = status.toLowerCase();
        input.dept_admin_remarks = remarks || deptRem;
      } else {
        input.admin_status = status.toLowerCase();
        input.admin_remarks = remarks || adminRem;
      }
    }

    onUpdate({
      variables: {
        id: rec.id,
        input,
      },
    });
    onClose();
  }

  function logRet() {
    if (!ret) {
      onToast("Enter a return time.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const moveDateStr = rec.movement_date.split("T")[0];

    if (moveDateStr > todayStr) {
      onToast("You cannot log a return for a future movement.");
      return;
    }

    if (moveDateStr === todayStr) {
      const now = new Date();
      const curTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (curTime < rec.out_time) {
        onToast(
          `You cannot log a return before the out-time (${to12(rec.out_time)}).`,
        );
        return;
      }
    }

    if (ret <= rec.out_time) {
      onToast("Must be after out time.");
      return;
    }
    handleAction("ADMIN", "Completed", adminRem, ret);
  }

  return (
    <>
      <div className="mr-ov" onClick={onClose} />
      <div className="mr-dr">
        <div className="mr-dr-hd">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="mr-dr-av" style={{ background: "#1d4ed8" }}>
              {initials(
                rec.employee?.first_name || "?",
                rec.employee?.last_name || "?",
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="mr-dr-nm">
                {rec.employee?.first_name}{" "}
                {rec.employee?.last_name || "Unknown"}
              </div>
              <div className="mr-dr-mt">
                {rec.employee_code} ·{" "}
                {rec.employee?.work_detail?.department?.name || "N/A"}
              </div>
              <div style={{ marginTop: 6 }}>
                <StatusCell status={rec.status} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="mr-dr-actions">
              <button
                className="mr-dr-dots"
                title="Actions"
                onClick={() => setShowMenu(!showMenu)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {showMenu && (
                <div
                  className="mr-dr-menu"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {isAdmin() && (
                    <div
                      className="mr-dr-item"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Update Time
                    </div>
                  )}
                  {!isCompleted && hasRole("ADMIN", "HOD") && (
                    <div
                      className="mr-dr-item mr-dr-danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this movement?",
                          )
                        ) {
                          onUpdate({
                            variables: {
                              id: rec.id,
                              input: { status: "cancelled" },
                            },
                          });
                          onClose();
                        }
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      Cancel Movement
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mr-dr-bd">
          {isEditing && (
            <div className="mr-edit-box">
              <div className="mr-edit-hd">Update Movement Time</div>
              <div className="mr-edit-f">
                <div>
                  <label className="mr-lbl">Out Time</label>
                  <div
                    className="mr-time-trigger"
                    onClick={() => setShowOutP(true)}
                  >
                    {to12(editOut)}
                  </div>
                  {showOutP && (
                    <AnalogTimePicker
                      initialTime={editOut}
                      onSave={(t: string) => {
                        setEditOut(t);
                        setShowOutP(false);
                      }}
                      onCancel={() => setShowOutP(false)}
                    />
                  )}
                </div>
                <div>
                  <label className="mr-lbl">Return By</label>
                  <div
                    className="mr-time-trigger"
                    onClick={() => setShowRetP(true)}
                  >
                    {to12(editRet)}
                  </div>
                  {showRetP && (
                    <AnalogTimePicker
                      initialTime={editRet}
                      onSave={(t: string) => {
                        setEditRet(t);
                        setShowRetP(false);
                      }}
                      onCancel={() => setShowRetP(false)}
                    />
                  )}
                </div>
              </div>
              <div className="mr-edit-btns">
                <button
                  className="mr-edit-btn mr-edit-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="mr-edit-btn mr-edit-save"
                  onClick={() => {
                    onUpdate({
                      variables: {
                        id: rec.id,
                        input: { out_time: editOut, in_time: editRet },
                      },
                    });
                    setIsEditing(false);
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
          {/* Time visual */}
          <div className="mr-sec">
            <div className="mr-sec-t">Movement Time</div>
            <div className="mr-tv">
              <div className="mr-tv-b">
                <div className="mr-tv-lbl">Out Time</div>
                <div className="mr-tv-t" style={{ color: "#d97706" }}>
                  {to12(rec.out_time)}
                </div>
                <div className="mr-tv-n">{fmtDate(rec.movement_date)}</div>
              </div>
              <div className="mr-tv-b">
                <div className="mr-tv-lbl">Expected Return</div>
                <div className="mr-tv-t" style={{ color: "#d97706" }}>
                  {to12(rec.in_time)}
                </div>
                <div className="mr-tv-n">Expected</div>
              </div>
              <div className="mr-tv-b">
                <div className="mr-tv-lbl">Actual Return</div>
                <div
                  className="mr-tv-t"
                  style={{
                    color: actualReturn
                      ? late
                        ? "#dc2626"
                        : "#16a34a"
                      : "#9ca3af",
                  }}
                >
                  {actualReturn ? to12(actualReturn) : "—"}
                </div>
                <div className="mr-tv-n">
                  {actualReturn ? (late ? "⚠ Late" : "On time") : "Pending"}
                </div>
              </div>
            </div>
          </div>
          {/* Details */}
          <div className="mr-sec">
            <div className="mr-sec-t">Details</div>
            <div className="mr-grid2">
              <DF
                label="Employee ID"
                value={rec.employee?.employee_id || rec.employee_code || ""}
                num
              />
              <DF
                label="Designation"
                value={rec.employee?.work_detail?.designation?.name || "N/A"}
              />
              <DF label="Date" value={fmtDate(rec.movement_date)} />
              <DF label="Reason" value={rec.movement_type} />
              <DF
                label="Plan (Out - In)"
                value={`${to12(rec.out_time)} - ${to12(rec.in_time)}`}
              />
            </div>
          </div>
          {/* Description */}
          <div className="mr-sec">
            <div className="mr-sec-t">Description</div>
            <div className="mr-desc-box">{rec.purpose}</div>
          </div>

          {/* Approval Workflow Layout matched to Leave */}
          <div className="mr-sec">
            <div className="mr-sec-t">Approval Workflow</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e8edf5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}
                  >
                    Department Admin Status
                  </span>
                  <StatusCell status={rec.dept_admin_status || "Pending"} />
                </div>
                {rec.dept_admin_remarks && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      fontStyle: "italic",
                      marginTop: 8,
                    }}
                  >
                    "{rec.dept_admin_remarks}"
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e8edf5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}
                  >
                    Admin Status
                  </span>
                  <StatusCell status={rec.admin_status || "Pending"} />
                </div>
                {rec.admin_remarks && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      fontStyle: "italic",
                      marginTop: 8,
                    }}
                  >
                    "{rec.admin_remarks}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions - DEPT ADMIN */}
          {isHod() &&
            (!rec.dept_admin_status ||
              rec.dept_admin_status?.toLowerCase() === "pending") && (
              <div className="mr-sec">
                <div
                  className="mr-sec-t"
                  style={{
                    color: "#1d4ed8",
                    borderBottom: "1px solid #eff6ff",
                  }}
                >
                  Dept Admin Actions
                </div>
                <textarea
                  className="mr-rem"
                  placeholder="Dept Admin remarks…"
                  value={deptRem}
                  onChange={(e) => setDeptRem(e.target.value)}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    className="mr-dr-btn mr-dr-reject"
                    onClick={() => handleAction("HOD", "Rejected", deptRem)}
                  >
                    Reject as Dept Admin
                  </button>
                  <button
                    className="mr-dr-btn mr-dr-approve"
                    onClick={() => handleAction("HOD", "Approved", deptRem)}
                  >
                    Approve as Dept Admin
                  </button>
                </div>
              </div>
            )}

          {/* Actions - ADMIN */}
          {isAdmin() &&
            (!rec.admin_status ||
              rec.admin_status?.toLowerCase() === "pending") && (
              <div className="mr-sec">
                <div
                  className="mr-sec-t"
                  style={{
                    color: "#1d4ed8",
                    borderBottom: "1px solid #eff6ff",
                  }}
                >
                  Admin Actions
                </div>
                <textarea
                  className="mr-rem"
                  placeholder="Admin remarks…"
                  value={adminRem}
                  onChange={(e) => setAdminRem(e.target.value)}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    className="mr-dr-btn mr-dr-reject"
                    onClick={() => handleAction("ADMIN", "Rejected", adminRem)}
                  >
                    Reject as Admin
                  </button>
                  <button
                    className="mr-dr-btn mr-dr-approve"
                    onClick={() => handleAction("ADMIN", "Approved", adminRem)}
                  >
                    Approve as Admin
                  </button>
                </div>
              </div>
            )}

          {/* Log return */}
          {hasRole("ADMIN", "HOD") &&
            rec.status?.toLowerCase() === "approved" &&
            !isCompleted && (
              <div className="mr-sec">
                <div className="mr-sec-t">Log Return</div>
                <div className="mr-rl">
                  <div className="mr-rl-t">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Employee has returned to office?
                  </div>
                  <div className="mr-rl-row">
                    <input
                      type="time"
                      className="mr-rl-in"
                      value={ret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRet(e.target.value)
                      }
                    />
                    <button className="mr-rl-btn" onClick={logRet}>
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
                      Log Return
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
        <div className="mr-dr-ft">
          <button
            className="mr-dr-btn mr-dr-close"
            style={{ flex: "unset", width: "100%" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function MovementRegister() {
  const { data: setvData } = useQuery<{
    settings: {
      departments: { id: string; name: string }[];
    };
  }>(GET_SETTINGS, { fetchPolicy: "network-only" });
  const departments = setvData?.settings?.departments || [];

  const [flt, setFlt] = useState<FilterState>({
    search: "",
    month: "",
    department: "All",
    status: "All",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data } = useQuery<{
    movements: {
      items: MovementRecord[];
      pageInfo: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
      };
    };
  }>(GET_MOVEMENTS, {
    variables: {
      pagination: { page: currentPage, limit: itemsPerPage },
      status: flt.status === "All" ? undefined : flt.status.toLowerCase(),
    },
  });

  const [updateMovement] = useMutation(UPDATE_MOVEMENT, {
    refetchQueries: [{ query: GET_MOVEMENTS }],
    onCompleted: () => {
      showToast("Movement updated successfully");
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`);
    },
  });

  const records = useMemo(
    () => data?.movements?.items || [],
    [data?.movements?.items],
  );
  const pageInfo = data?.movements?.pageInfo;

  const [sf, setSf] = useState<SortField>("date");
  const [sd, setSd] = useState<SortDir>("desc");
  const [drawer, setDrawer] = useState<MovementRecord | null>(null);
  const [modal, setModal] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [spin, setSpin] = useState<boolean>(false);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  const filtered = useMemo<MovementRecord[]>(() => {
    let list = [...records];
    // Note: Some filtering is now handled server-side (status).
    // Search and month are still client-side in this simple implementation
    // unless the backend is further updated.
    if (flt.search) {
      const q = flt.search.toLowerCase();
      list = list.filter((r: MovementRecord) => {
        const fullName =
          `${r.employee?.first_name || ""} ${r.employee?.last_name || ""}`.toLowerCase();
        return (
          fullName.includes(q) || r.employee_code.toLowerCase().includes(q)
        );
      });
    }
    if (flt.month)
      list = list.filter((r: MovementRecord) =>
        r.movement_date.startsWith(flt.month),
      );
    if (flt.department !== "All")
      list = list.filter(
        (r: MovementRecord) =>
          r.employee?.work_detail?.department?.id === flt.department,
      );

    list.sort((a: MovementRecord, b: MovementRecord) => {
      let va: string = "",
        vb: string = "";
      if (sf === "empId") {
        va = a.employee_code;
        vb = b.employee_code;
      }
      if (sf === "empName") {
        va = `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`;
        vb = `${b.employee?.first_name || ""} ${b.employee?.last_name || ""}`;
      }
      if (sf === "date") {
        va = a.movement_date + a.out_time;
        vb = b.movement_date + b.out_time;
      }
      if (sf === "status") {
        va = a.status;
        vb = b.status;
      }
      return sd === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [records, flt.search, flt.month, flt.department, sf, sd]);

  function sort(f: SortField) {
    if (sf === f) setSd((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else {
      setSf(f);
      setSd("asc");
    }
  }
  function setF<K extends keyof FilterState>(k: K, v: FilterState[K]) {
    setFlt((p: FilterState) => ({ ...p, [k]: v }));
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <MovementHeaderSection onOpenModal={() => setModal(true)} />

      <MovementFilterSection
        filters={flt}
        onFilterChange={setF}
        departments={departments}
        onRefresh={() => {
          setSpin(true);
          setTimeout(() => setSpin(false), 500);
          showToast("Records refreshed.");
        }}
        isSpinning={spin}
        resultCount={filtered.length}
      />

      <MovementTableSection
        items={filtered}
        onRowClick={(rec: MovementRecord) => setDrawer(rec)}
        sortState={{ sf, sd }}
        onSort={(f: SortField) => sort(f)}
        helpers={{ fmtDate, timeRange }}
        StatusCell={StatusCell}
      />

      <MovementPaginationSection
        pageInfo={pageInfo}
        onPageChange={setCurrentPage}
      />

      {drawer && (
        <Drawer
          rec={drawer}
          onClose={() => setDrawer(null)}
          onToast={showToast}
          onUpdate={updateMovement}
        />
      )}

      {modal && (
        <NewModal onClose={() => setModal(false)} onToast={showToast} />
      )}

      {toast && (
        <div className="mr-toast">
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
    </>
  );
}
