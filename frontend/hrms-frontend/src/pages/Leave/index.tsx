// src/pages/Leave/index.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_LEAVES,
  UPDATE_LEAVE_APPROVAL,
  CANCEL_LEAVE,
  UPDATE_LEAVE,
} from "../../graphql/leaveQueries";
import { GET_SETTINGS } from "../../graphql/settingsQueries";
import { isAdmin, hasRole, isHod } from "../../utils/auth";
import { formatDateForInput } from "../../utils/dateUtils";
import type { Leave, LeaveDayBreakdown } from "../../types";

// Modular Sections
import LeaveHeaderSection from "./components/sections/LeaveHeaderSection";
import LeaveStatsSection from "./components/sections/LeaveStatsSection";
import LeaveFilterSection from "./components/sections/LeaveFilterSection";
import LeaveTableSection from "./components/sections/LeaveTableSection";
import LeavePaginationSection from "./components/sections/LeavePaginationSection";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

// Derived overall status
type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Closed" | "Cancelled";

type LeaveType = "CL" | "OOD" | "SL" | "PL" | "ML" | "Pat_L" | "Other";

type SortField =
  | "name"
  | "empId"
  | "department"
  | "leaveType"
  | "startDate"
  | "deptStatus"
  | "hrStatus"
  | "finalStatus";
type SortDir = "asc" | "desc";

// Using unified types from "../../types"

interface FilterState {
  search: string;
  department: string;
  leaveType: string | "All";
  status: string | "All";
  monthYear: string;
}

interface LeavesData {
  leaves: {
    items: Leave[];
    pageInfo: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
    };
    rejectedCount: number;
    approvedCount: number;
    pendingCount: number;
    filteredTotalCount: number;
  };
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

// DEPARTMENTS will be fetched from settings

// LEAVE_TYPES will be fetched from settings

const LEAVE_TYPE_META: Record<
  LeaveType,
  { abbr: string; bg: string; color: string }
> = {
  CL: { abbr: "CL", bg: "#eff6ff", color: "#1d4ed8" }, // Casual Leave
  OOD: { abbr: "OOD", bg: "#f0fdff", color: "#0891b2" }, // On Official Duty
  SL: { abbr: "SL", bg: "#fffbeb", color: "#b45309" }, // Sick Leave
  PL: { abbr: "PL", bg: "#f0fdf4", color: "#15803d" }, // Paid Leave
  ML: { abbr: "ML", bg: "#fdf2f8", color: "#db2777" }, // Maternity Leave
  Pat_L: { abbr: "Pat_L", bg: "#f5f3ff", color: "#7c3aed" }, // Paternity Leave
  Other: { abbr: "OT", bg: "#f8fafc", color: "#64748b" },
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const TODAY = new Date().toISOString().split("T")[0];

function formatDate(iso: string | number | null | undefined): string {
  if (!iso) return "—";
  const s = String(iso);
  // Handle numeric timestamp
  if (!s.includes("-") && !isNaN(Number(s))) {
    const d = new Date(Number(s));
    if (isNaN(d.getTime())) return s;
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
    return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  // Handle ISO YYYY-MM-DD
  const p = s.split("-");
  if (p.length !== 3) return s;
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
  return `${m[parseInt(p[1], 10) - 1]} ${p[2]}, ${p[0]}`;
}

const getLeaveCode = (type: string) => {
  const t = String(type || "Other").toLowerCase();
  if (t.includes("casual")) return "CL";
  if (t.includes("official duty")) return "OOD";
  if (t.includes("sick")) return "SL";
  if (t.includes("paid")) return "PL";
  if (t.includes("maternity") || t.includes("meternity")) return "ML";
  if (t.includes("paternity")) return "Pat_L";
  return type || "Other";
};

const getLeaveName = (type: string) => {
  const code = getLeaveCode(type);
  const names: Record<string, string> = {
    CL: "Casual Leave",
    OOD: "On Official Duty",
    SL: "Sick Leave",
    PL: "Paid Leave",
    ML: "Maternity Leave",
    Pat_L: "Paternity Leave",
  };
  return names[code] || type;
};

// Status is now a single field from backend
function deriveStatus(req: Leave): LeaveStatus {
  const s = (req.status || "Pending").toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "cancelled") return "Cancelled";
  if (s === "closed") return "Closed";
  return "Pending";
}

/* ─────────────────────────────────────────────
   ERROR BOUNDARY
───────────────────────────────────────────── */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("EB Caught:", error, info);
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          style={{
            padding: 20,
            color: "red",
            background: "#fff",
            border: "1px solid red",
            margin: 20,
            borderRadius: 8,
          }}
        >
          Component Crash - Check Console
        </div>
      );
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── Base font ── */
  .lv-page { font-family:'DM Sans',sans-serif; }

  /* ── Page header ── */
  .lv-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; }
  .lv-title  { font-family:'DM Sans',sans-serif; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.5px; }
  .lv-sub    { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#64748b; margin-top:4px; }
  .lv-header-actions { display:flex; gap:10px; align-items:center; }
  .lv-header-btn {
    height:38px; padding:0 16px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
    cursor:pointer; display:inline-flex; align-items:center; gap:7px; color:#334155;
    transition:all 0.13s; white-space:nowrap;
  }
  .lv-header-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }
  .lv-header-btn-primary {
    background:#1d4ed8; color:#fff; border-color:#1d4ed8;
    box-shadow:0 2px 8px rgba(29,78,216,.22);
  }
  .lv-header-btn-primary:hover { background:#1e40af; border-color:#1e40af; }

  /* ── Stat Cards ── */
  .lv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin-bottom:20px; }
  .lv-stat-card {
    background:#fff; border:1px solid #e2e8f0; border-radius:12px;
    padding:15px 17px; box-shadow:0 1px 3px rgba(15,23,42,.05);
    display:flex; align-items:center; gap:13px; transition:box-shadow .14s, transform .14s;
  }
  .lv-stat-card:hover { box-shadow:0 6px 18px rgba(15,23,42,.09); transform:translateY(-1px); }
  .lv-stat-icon { width:42px; height:42px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  /* Numbers → Inter */
  .lv-stat-val { font-family:'Inter',sans-serif; font-size:26px; font-weight:700; letter-spacing:-1px; line-height:1; font-variant-numeric:tabular-nums; }
  .lv-stat-lbl { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#64748b; margin-top:3px; }
  .lv-stat-sub { font-family:'DM Sans',sans-serif; font-size:10.5px; color:#94a3b8; margin-top:2px; }

  /* ── Section Card ── */
  .lv-section {
    background:#fff; border:1px solid #e2e8f0; border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.04);
    overflow:hidden; margin-bottom:20px;
  }

  /* ── Collapsible Form ── */
  .lv-form-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 22px; cursor:pointer; user-select:none;
    border-bottom:1px solid transparent; transition:border-color .14s;
  }
  .lv-form-header.open { border-color:#f1f5f9; }
  .lv-form-header-left { display:flex; align-items:center; gap:10px; }
  .lv-form-icon { width:34px; height:34px; border-radius:9px; background:#eff6ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .lv-form-title { font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; color:#0f172a; }
  .lv-form-sub   { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:#94a3b8; margin-top:1px; }
  .lv-form-toggle { color:#94a3b8; transition:transform .2s; }
  .lv-form-toggle.open { transform:rotate(180deg); }
  .lv-form-body    { padding:0 22px 22px; }
  .lv-form-grid    { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .lv-form-grid-3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }
  .lv-form-full    { margin-bottom:14px; }
  .lv-field-label  { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:5px; display:block; }
  .lv-field-req    { color:#dc2626; margin-left:2px; }
  .lv-input, .lv-select, .lv-textarea {
    width:100%; height:36px; padding:0 12px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; transition:border-color .14s, box-shadow .14s;
    -webkit-appearance:none; appearance:none;
  }
  .lv-select {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 10px center; padding-right:30px; cursor:pointer;
  }
  .lv-textarea { height:80px; padding:9px 12px; resize:none; }
  .lv-input:focus, .lv-select:focus, .lv-textarea:focus {
    border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09);
  }
  .lv-input-error { border-color:#dc2626 !important; }
  .lv-error-msg   { font-family:'DM Sans',sans-serif; font-size:11px; color:#dc2626; margin-top:4px; font-weight:500; }
  .lv-days-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:0 12px; height:36px; border-radius:8px; background:#eff6ff; border:1px solid #bfdbfe;
    font-family:'Inter',sans-serif; font-size:13px; font-weight:700; color:#1d4ed8;
    font-variant-numeric:tabular-nums;
  }
  .lv-upload-box {
    width:100%; height:36px; border:1.5px dashed #e2e8f0; border-radius:8px;
    background:#f8fafc; cursor:pointer; display:flex; align-items:center;
    justify-content:center; gap:7px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#94a3b8;
    transition:border-color .14s;
  }
  .lv-upload-box:hover { border-color:#1d4ed8; color:#1d4ed8; }
  .lv-upload-box.uploaded { border-color:#15803d; color:#15803d; background:#f0fdf4; }
  .lv-form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
  .lv-btn {
    height:38px; padding:0 20px; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all .13s;
  }
  .lv-btn-primary { background:#1d4ed8; color:#fff; border:none; box-shadow:0 2px 8px rgba(29,78,216,.25); }
  .lv-btn-primary:hover { background:#1e40af; }
  .lv-btn-outline { background:#fff; color:#64748b; border:1.5px solid #e2e8f0; }
  .lv-btn-outline:hover { background:#f1f5f9; color:#0f172a; }

  /* ── Filter Bar ── */
  .lv-filter-bar {
    display:flex; align-items:center; flex-wrap:nowrap;
    gap:8px; padding:13px 18px; border-bottom:1px solid #f1f5f9;
  }
  .lv-search-wrap { position:relative; flex:0 0 200px; }
  .lv-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
  .lv-search {
    width:100%; height:36px; padding:0 12px 0 34px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; transition:border-color .14s;
  }
  .lv-search::placeholder { color:#94a3b8; }
  .lv-search:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09); }
  .lv-filter-sel, .lv-filter-date {
    height:36px; padding:0 26px 0 10px; border:1.5px solid #e2e8f0;
    border-radius:8px; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; color:#334155; background:#f8fafc;
    outline:none; cursor:pointer; flex-shrink:0;
    -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 9px center;
    transition:border-color .14s;
  }
  .lv-filter-date { padding:0 10px; cursor:text; background-image:none; width:128px; }
  .lv-filter-sel:focus, .lv-filter-date:focus { border-color:#1d4ed8; }
  .lv-filter-divider { width:1px; height:22px; background:#e2e8f0; flex-shrink:0; }
  .lv-filter-count   { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#64748b; white-space:nowrap; margin-left:auto; flex-shrink:0; }

  /* ── Bulk Bar ── */
  .lv-bulk-bar {
    display:flex; align-items:center; gap:10px;
    padding:10px 18px; background:#eff6ff; border-bottom:1px solid #bfdbfe;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#1d4ed8;
  }
  .lv-bulk-btn {
    height:30px; padding:0 12px; border-radius:6px; border:1px solid;
    background:#fff; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
    cursor:pointer; transition:all .12s; display:inline-flex; align-items:center; gap:5px;
  }
  .lv-bulk-approve { color:#15803d; border-color:#bbf7d0; }
  .lv-bulk-approve:hover { background:#dcfce7; }
  .lv-bulk-reject  { color:#dc2626; border-color:#fecaca; }
  .lv-bulk-reject:hover  { background:#fee2e2; }
  .lv-bulk-export  { color:#7c3aed; border-color:#ddd6fe; }
  .lv-bulk-export:hover  { background:#ede9fe; }
  .lv-bulk-clear   { color:#64748b; border-color:#e2e8f0; margin-left:auto; }
  .lv-bulk-clear:hover   { background:#f1f5f9; }

  /* ── Table ── */
  .lv-table-wrap { overflow-x:auto; }
  /* Custom Scrollbar for the table */
  .lv-table-wrap::-webkit-scrollbar { height:6px; }
  .lv-table-wrap::-webkit-scrollbar-track { background:#f1f5f9; }
  .lv-table-wrap::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:10px; }
  .lv-table-wrap::-webkit-scrollbar-thumb:hover { background:#94a3b8; }

  table.lv-table { width:100%; border-collapse:collapse; min-width:1200px; }
  .lv-table thead tr { background:#f8fafc; border-bottom:1.5px solid #e8edf5; }
  .lv-table th {
    padding:10px 13px; text-align:left;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#64748b;
    letter-spacing:.07em; text-transform:uppercase; white-space:nowrap;
    cursor:pointer; user-select:none;
  }
  .lv-table th:hover { color:#1d4ed8; }
  .lv-table th.lv-sorted { color:#1d4ed8; }
  .lv-th-inner { display:flex; align-items:center; gap:5px; }
  .lv-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background .1s; }
  .lv-table tbody tr:last-child { border-bottom:none; }
  .lv-table tbody tr:hover { background:#fafbfe; }
  .lv-table td { padding:11px 13px; vertical-align:middle; }

  /* ── Employee cell — name only, no email ── */
  .lv-emp-cell { display:flex; align-items:center; gap:10px; }
  .lv-emp-av   { width:33px; height:33px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; color:#fff; }
  .lv-emp-name { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:#0f172a; line-height:1.2; white-space:nowrap; }

  /* Emp ID — Inter monospace */
  .lv-emp-id { font-family:'Inter',sans-serif; font-size:11px; color:#94a3b8; margin-top:1px; font-variant-numeric:tabular-nums; }

  /* ── Leave Type Tag with abbreviation ── */
  .lv-type-tag {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 9px; border-radius:99px;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; white-space:nowrap;
  }
  .lv-type-abbr {
    font-family:'Inter',sans-serif; font-size:10px; font-weight:700;
    padding:1px 4px; border-radius:4px; background:rgba(0,0,0,.07);
  }

  /* ── Date range cell ── */
  .lv-date-range {
    display:flex; align-items:center; gap:6px;
  }
  .lv-date-val {
    font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#334155;
    font-variant-numeric:tabular-nums; white-space:nowrap;
  }
  .lv-date-sep {
    font-family:'Inter',sans-serif; font-size:12px; font-weight:500; color:#94a3b8;
  }

  /* ── Days count — Inter ── */
  .lv-days-cell {
    font-family:'Inter',sans-serif; font-size:13px; font-weight:700; color:#0f172a;
    font-variant-numeric:tabular-nums;
  }
  .lv-days-unit {
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; color:#94a3b8; margin-left:2px;
  }

  /* ── Document indicator ── */
  .lv-doc-yes {
    display:inline-flex; align-items:center; gap:5px; padding:3px 8px;
    border-radius:7px; background:#f0fdf4; border:1px solid #bbf7d0;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#15803d;
    white-space:nowrap;
  }
  .lv-doc-no {
    font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; color:#cbd5e1;
  }

  /* ── Dept Pill ── */
  .lv-dept-pill {
    display:inline-block; padding:3px 10px; border-radius:99px;
    background:#eff6ff; color:#1d4ed8;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600;
    max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }

  /* ── Overall status badge (larger) ── */
  .lv-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:99px;
    font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; white-space:nowrap;
  }
  .lv-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; opacity:.75; }
  .lv-badge-pending  { background:#fffbeb; color:#b45309; }
  .lv-badge-approved { background:#f0fdf4; color:#15803d; }
  .lv-badge-rejected { background:#fef2f2; color:#dc2626; }
  .lv-badge-cancelled{ background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-size:10.5px; padding:2px 8px; }
  .lv-badge-closed   { background:#f1f5f9; color:#475569; }

  /* ── Step Badges (used in drawer) ── */
  .lv-step-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 9px; border-radius:99px;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; white-space:nowrap;
  }
  .lv-step-badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.75; }
  .lv-step-pending  { background:#fffbeb; color:#b45309; }
  .lv-step-approved { background:#f0fdf4; color:#15803d; }
  .lv-step-rejected { background:#fef2f2; color:#dc2626; }
  .lv-step-cancelled{ background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-size:10px; padding:1.5px 7px; }

  /* ── 3-dot Action Menu ── */
  .lv-dots-wrap { position:relative; display:inline-flex; justify-content:center; }
  .lv-dots-btn {
    width:30px; height:30px; border-radius:7px; border:1px solid #e2e8f0; background:#f8fafc;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; transition:all .13s; padding:0;
  }
  .lv-dots-btn:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0f172a; }
  .lv-dots-menu {
    position:absolute; top:calc(100% + 6px); right:0; z-index:50;
    background:#fff; border:1px solid #e2e8f0; border-radius:10px;
    box-shadow:0 8px 24px rgba(15,23,42,.12); min-width:150px; overflow:hidden;
    animation:lvMenuIn .14s ease both;
  }
  @keyframes lvMenuIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  .lv-dots-item {
    display:flex; align-items:center; gap:9px;
    padding:9px 14px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#334155;
    cursor:pointer; transition:background .1s; white-space:nowrap; background:none; border:none; width:100%; text-align:left;
  }
  .lv-dots-item:hover { background:#f8fafc; }
  .lv-dots-item.approve { color:#15803d; }
  .lv-dots-item.approve:hover { background:#f0fdf4; }
  .lv-dots-item.reject  { color:#dc2626; }
  .lv-dots-item.reject:hover  { background:#fef2f2; }
  .lv-dots-divider { height:1px; background:#f1f5f9; margin:3px 0; }

  /* ── Checkbox ── */
  .lv-cb { width:15px; height:15px; cursor:pointer; accent-color:#1d4ed8; }

  /* ── Empty ── */
  .lv-empty { padding:52px 24px; text-align:center; }
  .lv-empty-icon { width:52px; height:52px; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#94a3b8; }
  .lv-empty p    { font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:#64748b; margin-bottom:4px; }
  .lv-empty span { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#94a3b8; }

  /* ── Drawer ── */
  .lv-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:100; animation:lvFade .18s ease both; }
  @keyframes lvFade { from{opacity:0} to{opacity:1} }
  .lv-drawer {
    position:fixed; top:0; right:0; bottom:0; width:520px; background:#fff;
    z-index:101; overflow:hidden; box-shadow:-8px 0 40px rgba(15,23,42,.14);
    animation:lvSlide .22s cubic-bezier(.16,1,.3,1) both; display:flex; flex-direction:column;
  }
  @keyframes lvSlide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .lv-drawer-head {
    display:flex; align-items:flex-start; justify-content:space-between;
    padding:20px 24px 16px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
  }
  .lv-drawer-av   { width:48px; height:48px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; color:#fff; }
  .lv-drawer-name { font-family:'DM Sans',sans-serif; font-size:17px; font-weight:700; color:#0f172a; letter-spacing:-.3px; }
  .lv-drawer-sub  { font-family:'Inter',sans-serif; font-size:11.5px; color:#94a3b8; margin-top:2px; font-variant-numeric:tabular-nums; }
  .lv-drawer-close-x {
    width:30px; height:30px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; flex-shrink:0; transition:all .13s; padding:0;
  }
  .lv-drawer-close-x:hover { background:#f1f5f9; color:#0f172a; }
  .lv-drawer-scroll { flex:1; overflow-y:auto; padding:0 24px 24px; }
  .lv-drawer-section { margin-top:22px; }
  .lv-drawer-section-title {
    font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:700; color:#1d4ed8;
    letter-spacing:.1em; text-transform:uppercase;
    margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #eff6ff;
  }
  .lv-drawer-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .lv-dfield label { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; color:#94a3b8; display:block; margin-bottom:3px; }
  .lv-dfield span  { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#0f172a; font-weight:500; display:block; }
  .lv-dfield-num span { font-family:'Inter',sans-serif; font-weight:700; font-variant-numeric:tabular-nums; }
  .lv-reason-box {
    padding:12px 14px; background:#f8fafc; border:1px solid #e8edf5;
    border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#334155; line-height:1.55;
  }
  .lv-balance-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .lv-bal-item { padding:12px; border-radius:10px; background:#f8fafc; border:1px solid #e8edf5; text-align:center; }
  .lv-bal-val  { font-family:'Inter',sans-serif; font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; }
  .lv-bal-lbl  { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; color:#64748b; margin-top:3px; }

  /* Two-step approval in drawer */
  .lv-approval-steps { display:flex; flex-direction:column; gap:12px; }
  .lv-approval-step {
    padding:14px 16px; border-radius:10px; background:#f8fafc; border:1px solid #e8edf5;
  }
  .lv-step-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
  .lv-step-title { font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; color:#334155; }
  .lv-step-by    { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:500; color:#64748b; margin-top:2px; }
  .lv-step-remarks { font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; color:#64748b; margin-top:8px; font-style:italic; }

  .lv-remarks-input {
    width:100%; height:70px; padding:9px 12px; margin-top:8px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; resize:none; transition:border-color .14s;
  }
  .lv-remarks-input:focus { border-color:#1d4ed8; background:#fff; }

  .lv-drawer-actions {
    display:flex; gap:10px; padding:16px 24px;
    border-top:1px solid #f1f5f9; background:#fafbfe; flex-shrink:0;
  }
  .lv-drawer-btn {
    flex:1; height:38px; border-radius:8px; border:none;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700;
    cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all .13s;
  }
  .lv-drawer-approve { background:#15803d; color:#fff; box-shadow:0 2px 6px rgba(21,128,61,.25); }
  .lv-drawer-approve:hover { background:#166534; }
  .lv-drawer-reject  { background:#fff; color:#dc2626; border:1.5px solid #fecaca !important; }
  .lv-drawer-reject:hover { background:#fef2f2; }
  .lv-drawer-close-btn { background:#fff; color:#64748b; border:1.5px solid #e2e8f0 !important; }
  .lv-drawer-close-btn:hover { background:#f1f5f9; }

  /* ── Toast ── */
  .lv-toast {
    position:fixed; bottom:28px; right:28px; background:#0f172a; color:#fff;
    padding:12px 18px; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;
    display:flex; align-items:center; gap:9px;
    box-shadow:0 8px 24px rgba(0,0,0,.22); z-index:9999;
    animation:lvToast .3s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes lvToast { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  @keyframes lvRowIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  .lv-row-in { animation:lvRowIn .22s ease both; }

  /* ── Reject confirm modal ── */
  .lv-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.45); z-index:200; display:flex; align-items:center; justify-content:center; animation:lvFade .18s ease both; }
  .lv-modal { background:#fff; border-radius:16px; padding:28px; width:400px; box-shadow:0 20px 60px rgba(15,23,42,.22); animation:lvModalUp .2s cubic-bezier(.16,1,.3,1) both; }
  @keyframes lvModalUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .lv-modal-icon { width:44px; height:44px; border-radius:12px; background:#fef2f2; display:flex; align-items:center; justify-content:center; margin-bottom:14px; color:#dc2626; }
  .lv-modal h3 { font-family:'DM Sans',sans-serif; font-size:17px; font-weight:700; color:#0f172a; margin-bottom:8px; }
  .lv-modal p  { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#64748b; line-height:1.55; margin-bottom:14px; }
  .lv-modal-actions { display:flex; gap:10px; }
  .lv-modal-cancel  { flex:1; height:38px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; color:#64748b; cursor:pointer; transition:all .12s; }
  .lv-modal-cancel:hover { background:#f1f5f9; }
  .lv-modal-confirm { flex:1; height:38px; border-radius:8px; border:none; background:#dc2626; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer; transition:all .12s; }
  .lv-modal-confirm:hover { background:#b91c1c; }

  /* ── Pagination ── */
  .lv-pagination { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfe; }
  .lv-pag-info { font-size: 13px; color: #64748b; font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .lv-pag-btns { display: flex; gap: 8px; }
  .lv-pag-btn { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; font-size: 13px; cursor: pointer; color: #334155; transition: 0.2s; font-family: 'DM Sans', sans-serif; font-weight: 600; }
  .lv-pag-btn:hover:not(:disabled) { background: #f8fafc; border-color: #1d4ed8; color: #1d4ed8; }
  .lv-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .lv-pag-btn.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }

  /* ── Update Leave Modal ── */
  .lv-up-dates-table { width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #eef2ff; border-radius:10px; overflow:hidden; }
  .lv-up-dates-table th { background:#f8fafc; padding:10px; font-size:12px; color:#64748b; text-align:left; border-bottom:1px solid #eef2ff; }
  .lv-up-dates-table td { padding:10px; font-size:13px; color:#334155; border-bottom:1px solid #eef2ff; }
  .lv-up-dates-table tr:last-child td { border-bottom:none; }
  .lv-up-total { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:#f0fdf4; border-radius:8px; margin-bottom:16px; }
  .lv-up-total-lbl { font-size:13px; font-weight:700; color:#166534; }
  .lv-up-total-val { font-size:15px; font-weight:800; color:#1d4ed8; font-family:'Inter',sans-serif; }
`;

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
function OverallStatusBadge({ req }: { req: Leave }) {
  const status = deriveStatus(req);
  const cls: Record<LeaveStatus, string> = {
    Pending: "lv-badge lv-badge-pending",
    Approved: "lv-badge lv-badge-approved",
    Rejected: "lv-badge lv-badge-rejected",
    Cancelled: "lv-badge lv-badge-cancelled",
    Closed: "lv-badge lv-badge-closed",
  };
  return <span className={cls[status]}>{status}</span>;
}

function StepBadge({ status }: { status: string }) {
  const s = (status || "Pending").toLowerCase();
  const cls: Record<string, string> = {
    pending: "lv-step-badge lv-step-pending",
    approved: "lv-step-badge lv-step-approved",
    rejected: "lv-step-badge lv-step-rejected",
    cancelled: "lv-step-badge lv-step-cancelled",
  };
  return (
    <span className={cls[s] || cls.pending}>
      {s === "cancelled" ? "Cancelled" : status || "Pending"}
    </span>
  );
}

function LeaveTypeTag({ type }: { type: string }) {
  const code = getLeaveCode(type) as LeaveType;
  const meta = LEAVE_TYPE_META[code] || LEAVE_TYPE_META["Other"];
  const fullName = getLeaveName(type);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        className="lv-type-tag"
        style={{ background: meta.bg, color: meta.color }}
        title={fullName}
      >
        {code}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
        {fullName}
      </span>
    </div>
  );
}

interface ViewFieldProps {
  label: string;
  value: string;
  isNum?: boolean;
}
function ViewField({ label, value, isNum }: ViewFieldProps) {
  return (
    <div className={`lv-dfield${isNum ? " lv-dfield-num" : ""}`}>
      <label>{label}</label>
      <span>{value || "—"}</span>
    </div>
  );
}
/* ─────────────────────────────────────────────
   REJECT CONFIRM MODAL
───────────────────────────────────────────── */
interface RejectModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}
function RejectModal({ name, onConfirm, onCancel }: RejectModalProps) {
  return (
    <div className="lv-modal-overlay">
      <div className="lv-modal">
        <div className="lv-modal-icon">
          <svg
            width="24"
            height="24"
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
        </div>
        <h3>Reject Leave Request</h3>
        <p>
          Are you sure you want to reject the leave application for{" "}
          <strong>{name}</strong>?
        </p>
        <div className="lv-modal-actions">
          <button className="lv-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="lv-modal-confirm" onClick={onConfirm}>
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEAVE DETAIL DRAWER
───────────────────────────────────────────── */
interface DrawerProps {
  req: Leave;
  onClose: () => void;
  onCancel?: (id: string) => void;
  onApprove: (id: string, remarks: string, role: string) => void;
  onReject: (id: string, remarks: string, role: string) => void;
}

/* ─────────────────────────────────────────────
   UPDATE LEAVE MODAL
───────────────────────────────────────────── */
interface UpdateModalProps {
  req: Leave;
  onClose: () => void;
  onToast: (m: string) => void;
}

function UpdateLeaveModal({ req, onClose, onToast }: UpdateModalProps) {
  const [fromDate, setFromDate] = useState(() =>
    formatDateForInput(req.from_date),
  );
  const [toDate, setToDate] = useState(() => formatDateForInput(req.to_date));
  const [reason, setReason] = useState(req.reason || "");
  const [daysData, setDaysData] = useState<{ date: string; type: string }[]>(
    [],
  );

  const [updateLeave] = useMutation(UPDATE_LEAVE, {
    refetchQueries: [{ query: GET_LEAVES }],
    onCompleted: () => {
      onToast("Leave request updated successfully");
      onClose();
    },
    onError: (err) => onToast(`Error: ${err.message}`),
  });

  // Initialize daysData based on the selected date range
  useEffect(() => {
    if (!fromDate || !toDate) return;

    const start = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid dates in UpdateLeaveModal:", fromDate, toDate);
      return;
    }

    const list: { date: string; type: string }[] = [];
    const curr = new Date(start);

    // Safety break to prevent infinite loops
    let limit = 0;
    while (curr <= end && limit < 100) {
      limit++;
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      const dStr = `${y}-${m}-${d}`;

      // Try to find if this date already has a breakdown in the backend
      const existing = (req.day_breakdowns || []).find(
        (b: LeaveDayBreakdown) => b.date === dStr,
      );

      list.push({
        date: dStr,
        type: existing?.leave_type || "Full Day",
      });

      curr.setDate(curr.getDate() + 1);
    }
    setTimeout(() => setDaysData(list), 0);
  }, [fromDate, toDate, req.day_breakdowns]);

  const totalDays = useMemo(() => {
    return daysData.reduce(
      (acc, d) => acc + (d.type === "Full Day" ? 1 : 0.5),
      0,
    );
  }, [daysData]);

  function submit() {
    if (new Date(toDate) < new Date(fromDate)) {
      onToast("End date cannot be before start date.");
      return;
    }
    const day_breakdowns = daysData.map((d) => ({
      date: d.date,
      leave_type: d.type,
    }));
    updateLeave({
      variables: {
        id: req.id,
        input: {
          from_date: fromDate,
          to_date: toDate,
          total_days: totalDays,
          reason: reason,
          day_breakdowns,
        },
      },
    });
  }

  return (
    <div
      className="lv-modal-overlay"
      style={{ zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="lv-modal"
        style={{ width: 500, padding: 0, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="lv-mi-h"
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Modify Leave Request
          </span>
          <button className="lv-drawer-close-x" onClick={onClose}>
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
        <div style={{ padding: 22, maxHeight: "70vh", overflowY: "auto" }}>
          <div
            className="lv-form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className="lv-ff">
              <label className="lv-field-label">From Date</label>
              <input
                type="date"
                className="lv-input"
                disabled
                style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="lv-ff">
              <label className="lv-field-label">To Date</label>
              <input
                type="date"
                className="lv-input"
                disabled
                style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              className="lv-field-label"
              style={{ marginBottom: 8, display: "block" }}
            >
              Daily Breakdown
            </label>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Leave Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daysData.map((d, i) => (
                    <tr
                      key={d.date}
                      style={{
                        borderBottom:
                          i < daysData.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(d.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { weekday: "short", month: "short", day: "numeric" },
                        )}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          className="lv-select"
                          style={{
                            height: 32,
                            fontSize: 12,
                            width: "100%",
                            borderRadius: 6,
                          }}
                          value={d.type}
                          onChange={(e) => {
                            const newList = [...daysData];
                            newList[i].type = e.target.value;
                            setDaysData(newList);
                          }}
                        >
                          <option value="Full Day">Full Day</option>
                          <option value="Half Day Morning">
                            First Half (Morning)
                          </option>
                          <option value="Half Day Afternoon">
                            Second Half (Afternoon)
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {daysData.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: "#94a3b8",
                        }}
                      >
                        Generating breakdown...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="lv-up-total"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#f0fdf4",
              borderRadius: 8,
              border: "1px solid #bbf7d0",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
              Total Leave Duration
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#15803d" }}>
              {totalDays} Day(s)
            </span>
          </div>

          <div className="lv-ff">
            <label className="lv-field-label">Reason</label>
            <textarea
              className="lv-input"
              style={{
                width: "100%",
                height: 70,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for change..."
            />
          </div>
        </div>
        <div
          className="lv-mi-f"
          style={{
            display: "flex",
            gap: 12,
            padding: "18px 22px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <button className="lv-btn" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="lv-btn lv-btn-primary"
            style={{ flex: 1, background: "#1d4ed8", color: "#fff" }}
            onClick={submit}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveDrawer({
  req,
  onClose,
  onCancel,
  onApprove,
  onReject,
  onOpenUpdate,
}: DrawerProps & { onOpenUpdate: () => void }) {
  const [remarks, setRemarks] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);

  const [cancelLeave] = useMutation(CANCEL_LEAVE, {
    refetchQueries: [{ query: GET_LEAVES }],
    onCompleted: () => {
      onClose();
    },
  });

  return (
    <>
      <div className="lv-overlay" onClick={onClose} />
      <div className="lv-drawer">
        {/* Header */}
        <div className="lv-drawer-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="lv-drawer-av" style={{ background: "#1d4ed8" }}>
              {getInitials(
                req.employee?.first_name || "?",
                req.employee?.last_name || "?",
              )}
            </div>
            <div>
              <div className="lv-drawer-name">
                {req.employee?.first_name}{" "}
                {req.employee?.last_name || "Unknown Employee"}
              </div>
              <div className="lv-drawer-sub">
                {req.employee_code} ·{" "}
                {req.employee?.work_detail?.department?.name || "N/A"}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <OverallStatusBadge req={req} />
                <LeaveTypeTag type={req.leave_type as LeaveType} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="lv-dots-wrap">
              <button
                className="lv-dots-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                <svg
                  width="18"
                  height="18"
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
                  className="lv-dots-menu"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {hasRole("ADMIN", "HOD") && (
                    <button
                      className="lv-dots-item"
                      onClick={() => {
                        onOpenUpdate();
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
                      Update leave
                    </button>
                  )}
                  {hasRole("ADMIN", "HOD") && (
                    <button
                      className="lv-dots-item reject"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this leave?",
                          )
                        ) {
                          cancelLeave({ variables: { id: req.id } });
                        }
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
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      Cancel leave
                    </button>
                  )}
                </div>
              )}
            </div>
            <button className="lv-drawer-close-x" onClick={onClose}>
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

        {/* Body */}
        <div className="lv-drawer-scroll">
          {/* Leave Details */}
          <div className="lv-drawer-section">
            <div className="lv-drawer-section-title">Leave Details</div>
            <div className="lv-drawer-grid">
              <ViewField label="Leave Type" value={req.leave_type} />
              <ViewField
                label="Applied On"
                value={formatDate(req.requested_date || TODAY)}
              />
              <ViewField label="Start Date" value={formatDate(req.from_date)} />
              <ViewField label="End Date" value={formatDate(req.to_date)} />
              <ViewField
                label="Total Days"
                value={`${req.total_days} day${req.total_days !== 1 ? "s" : ""}`}
                isNum
              />
              <div className="lv-dfield">
                <label>Document</label>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>
                  Not attached
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="lv-drawer-section">
            <div className="lv-drawer-section-title">Reason</div>
            <div className="lv-reason-box">{req.reason}</div>
          </div>

          {/* Approval Workflow */}
          <div className="lv-drawer-section">
            <div className="lv-drawer-section-title">Approval Workflow</div>
            <div className="lv-approval-steps">
              {req.approvals?.map((appr) => (
                <div className="lv-approval-step" key={appr.role}>
                  <div className="lv-step-header">
                    <div className="lv-step-title">
                      {appr.role === "HEAD OF DEPARTMENT"
                        ? "Department Admin Status"
                        : "Admin Status"}
                    </div>
                    <StepBadge status={appr.status} />
                  </div>
                  {appr.remarks && (
                    <div className="lv-step-remarks">"{appr.remarks}"</div>
                  )}
                </div>
              ))}
              {!req.approvals?.length && (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  No approval workflow initialized
                </div>
              )}
            </div>
          </div>

          {/* Actions for Dept Admin */}
          {isHod() &&
            (
              req.approvals?.find((a) => a.role === "HEAD OF DEPARTMENT")
                ?.status || "pending"
            ).toLowerCase() === "pending" && (
              <div className="lv-drawer-section">
                <div className="lv-drawer-section-title">
                  Dept Admin Actions
                </div>
                <textarea
                  className="lv-remarks-input"
                  placeholder="Dept Admin remarks…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    className="lv-drawer-btn lv-drawer-reject"
                    onClick={() =>
                      onReject(req.id, remarks, "HEAD OF DEPARTMENT")
                    }
                  >
                    Reject as Dept Admin
                  </button>
                  <button
                    className="lv-drawer-btn lv-drawer-approve"
                    onClick={() =>
                      onApprove(req.id, remarks, "HEAD OF DEPARTMENT")
                    }
                  >
                    Approve as Dept Admin
                  </button>
                </div>
              </div>
            )}

          {/* Actions for Admin */}
          {isAdmin() &&
            (
              req.approvals?.find((a) => a.role === "ADMIN")?.status ||
              "pending"
            ).toLowerCase() === "pending" && (
              <div className="lv-drawer-section">
                <div className="lv-drawer-section-title">Admin Actions</div>
                <textarea
                  className="lv-remarks-input"
                  placeholder="Admin remarks…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    className="lv-drawer-btn lv-drawer-reject"
                    onClick={() => onReject(req.id, remarks, "ADMIN")}
                  >
                    Reject as Admin
                  </button>
                  <button
                    className="lv-drawer-btn lv-drawer-approve"
                    onClick={() => onApprove(req.id, remarks, "ADMIN")}
                  >
                    Approve as Admin
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Action: Cancel Leave (Only if not completed) */}
        {hasRole("ADMIN", "HOD") &&
          req.status !== "cancelled" &&
          new Date(req.to_date) >= new Date() && (
            <div
              className="lv-drawer-section"
              style={{ marginTop: 0, padding: "0 24px 16px" }}
            >
              <button
                className="lv-drawer-btn lv-drawer-reject"
                style={{ width: "100%", border: "1.5px solid #fecaca" }}
                onClick={() => onCancel && onCancel(req.id)}
              >
                Cancel Leave Request
              </button>
            </div>
          )}

        {/* Footer */}
        <div className="lv-drawer-actions">
          <button
            className="lv-drawer-btn lv-drawer-close-btn"
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
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Leave() {
  /* Pagination State */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    department: "All",
    leaveType: "All",
    status: "All",
    monthYear: "",
  });

  const [sortField, setSortField] = useState<SortField>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerReq, setDrawerReq] = useState<Leave | null>(null);
  const [toast, setToast] = useState<string>("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    name: string;
    remarks: string;
    level: string;
  } | null>(null);

  /* Local Search Term for Debouncing */
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  /* Fetch Departments from Settings */
  const { data: settingsData } = useQuery<{
    settings: {
      departments: { id: string; name: string }[];
      leave_types: { name: string; total_days: number }[];
      employee_types: { name: string }[];
    };
  }>(GET_SETTINGS);
  const departments = useMemo(() => {
    const list = settingsData?.settings?.departments || [];
    return [{ id: "All", name: "All Departments" }, ...list];
  }, [settingsData]);

  const leaveTypes = useMemo(() => {
    const list =
      settingsData?.settings?.leave_types?.map((lt) => lt.name) || [];
    return ["All", ...list];
  }, [settingsData]);

  const { data, loading, error } = useQuery<LeavesData>(GET_LEAVES, {
    fetchPolicy: "network-only",
    variables: {
      status: filters.status === "All" ? null : filters.status.toLowerCase(),
      leave_type: filters.leaveType === "All" ? null : filters.leaveType,
      department: filters.department === "All" ? null : filters.department,
      search: filters.search || null,
      month: filters.monthYear
        ? parseInt(filters.monthYear.split("-")[1], 10)
        : null,
      year: filters.monthYear
        ? parseInt(filters.monthYear.split("-")[0], 10)
        : null,
      pagination: {
        page: currentPage,
        limit: itemsPerPage,
      },
    },
  });

  const [updateLeaveApproval] = useMutation(UPDATE_LEAVE_APPROVAL, {
    refetchQueries: [{ query: GET_LEAVES }],
  });

  const [cancelLeaveMutation] = useMutation(CANCEL_LEAVE, {
    refetchQueries: [{ query: GET_LEAVES }],
  });

  const requests = useMemo<Leave[]>(() => data?.leaves?.items || [], [data]);
  const pageInfo = data?.leaves?.pageInfo;
  const totalCount = pageInfo?.totalCount || 0;
  const totalPages = pageInfo?.totalPages || 1;
  const overallPending = useMemo(() => data?.leaves?.pendingCount || 0, [data]);
  const overallApproved = useMemo(
    () => data?.leaves?.approvedCount || 0,
    [data],
  );
  const overallRejected = useMemo(
    () => data?.leaves?.rejectedCount || 0,
    [data],
  );
  const filteredTotal = useMemo(
    () => data?.leaves?.filteredTotalCount || 0,
    [data],
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }

  /* Simplified filtered list (mostly server-side) */
  const filtered = useMemo<Leave[]>(() => {
    const list = [...requests];

    // Server-side search and filtering are already applied.
    // Client-side search is removed to prevent redundant/conflicting logic.

    list.sort((a: Leave, b: Leave) => {
      let va: string | number | undefined = "",
        vb: string | number | undefined = "";
      if (sortField === "name") {
        va = `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`;
        vb = `${b.employee?.first_name || ""} ${b.employee?.last_name || ""}`;
      }
      if (sortField === "empId") {
        va = a.employee_code;
        vb = b.employee_code;
      }
      if (sortField === "leaveType") {
        va = a.leave_type;
        vb = b.leave_type;
      }
      if (sortField === "startDate") {
        va = a.from_date;
        vb = b.from_date;
      }
      if (sortField === "deptStatus") {
        va = a.approvals?.find((x) => x.role === "HEAD OF DEPARTMENT")?.status;
        vb = b.approvals?.find((x) => x.role === "HEAD OF DEPARTMENT")?.status;
      }
      if (sortField === "hrStatus") {
        va = a.approvals?.find((x) => x.role === "ADMIN")?.status;
        vb = b.approvals?.find((x) => x.role === "ADMIN")?.status;
      }
      if (sortField === "finalStatus") {
        va = a.status;
        vb = b.status;
      }

      if (typeof va === "string" && typeof vb === "string")
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc"
        ? (va || 0) > (vb || 0)
          ? 1
          : -1
        : (vb || 0) > (va || 0)
          ? 1
          : -1;
    });
    return list;
  }, [requests, sortField, sortDir]);

  /* Stats (Overall counts from backend) */
  const stats = useMemo(
    () => ({
      total: filteredTotal,
      pending: overallPending,
      approved: overallApproved,
      rejected: overallRejected,
    }),
    [filteredTotal, overallPending, overallApproved, overallRejected],
  );

  /* Sort */
  function handleSort(field: SortField) {
    if (sortField === field)
      setSortDir((d: SortDir) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  /* Select */
  function toggleSelect(id: string) {
    setSelected((prev: string[]) =>
      prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id],
    );
  }
  function toggleAll() {
    setSelected((prev: string[]) =>
      prev.length === filtered.length ? [] : filtered.map((r: Leave) => r.id),
    );
  }

  /* Filter */
  function setFilter<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    setFilters((prev: FilterState) => ({ ...prev, [key]: val }));
    setSelected([]);
  }

  /* Approve */
  function handleApprove(id: string, remarks: string, role: string) {
    updateLeaveApproval({
      variables: {
        id,
        role,
        status: "approved",
        remarks: remarks || `Approved by ${role}.`,
      },
    })
      .then(() => {
        showToast("Leave request approved.");
        if (drawerReq?.id === id) setDrawerReq(null);
      })
      .catch((err) => {
        console.error(err);
        alert("Approval failed: " + err.message);
      });
  }

  /* Reject */
  function initiateReject(
    id: string,
    name: string,
    remarks: string,
    role: string,
  ) {
    setRejectTarget({ id, name, remarks, level: role });
  }
  function confirmReject() {
    if (!rejectTarget) return;

    updateLeaveApproval({
      variables: {
        id: rejectTarget.id,
        role: rejectTarget.level,
        status: "rejected",
        remarks: rejectTarget.remarks || `Rejected by ${rejectTarget.level}.`,
      },
    })
      .then(() => {
        showToast("Leave request rejected.");
        setRejectTarget(null);
        if (drawerReq?.id === rejectTarget.id) setDrawerReq(null);
      })
      .catch((err) => {
        console.error(err);
        alert("Rejection failed: " + err.message);
      });
  }

  /* Bulk */

  if (loading && !data)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading Leave Management...
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 40, color: "red" }}>Error: {error.message}</div>
    );

  /* ── RENDER ── */
  return (
    <div className="lv-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Page Header */}
      <LeaveHeaderSection onExport={() => window.print()} />

      {/* Stat Cards */}
      <LeaveStatsSection stats={stats} />

      {/* Main Content Section */}
      <div className="lv-section">
        {/* Filter Bar */}
        <LeaveFilterSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilter}
          departments={departments}
          leaveTypes={leaveTypes}
          getLeaveName={getLeaveName}
          totalCount={totalCount}
        />

        {/* Table */}
        <LeaveTableSection
          requests={filtered}
          selectedItems={selected}
          sort={{ field: sortField, dir: sortDir }}
          actions={{
            onSort: (f: SortField) => handleSort(f),
            onToggleSelect: toggleSelect,
            onToggleAll: toggleAll,
            onViewDetails: setDrawerReq,
          }}
          helpers={{
            getLeaveCode,
            getLeaveName,
            formatDate,
            LEAVE_TYPE_META,
          }}
          components={{
            OverallStatusBadge,
            StepBadge,
          }}
        />

        {/* Pagination */}
        <LeavePaginationSection
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          filteredTotal={filteredTotal}
        />
      </div>

      {/* Detail Drawer */}
      {drawerReq && (
        <ErrorBoundary>
          <LeaveDrawer
            req={drawerReq}
            onClose={() => setDrawerReq(null)}
            onOpenUpdate={() => setShowUpdateModal(true)}
            onCancel={(id: string) => {
              if (
                window.confirm("Are you sure you want to cancel this leave?")
              ) {
                cancelLeaveMutation({ variables: { id } })
                  .then(() => {
                    showToast("Leave cancelled.");
                    setDrawerReq(null);
                  })
                  .catch((err) => {
                    console.error(err);
                    alert("Cancellation failed: " + err.message);
                  });
              }
            }}
            onApprove={(id: string, remarks: string, role: string) => {
              handleApprove(id, remarks, role);
              setDrawerReq(null);
            }}
            onReject={(id: string, remarks: string, role: string) => {
              initiateReject(
                id,
                `${drawerReq.employee?.first_name || ""} ${drawerReq.employee?.last_name || ""}`.trim() ||
                  "Employee",
                remarks,
                role,
              );
              setDrawerReq(null);
            }}
          />
        </ErrorBoundary>
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
        <div className="lv-toast">
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
      {/* Update Modal */}
      {showUpdateModal && drawerReq && (
        <UpdateLeaveModal
          req={drawerReq}
          onClose={() => setShowUpdateModal(false)}
          onToast={showToast}
        />
      )}
    </div>
  );
}
