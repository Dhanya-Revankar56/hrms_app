// src/pages/Attendance.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ATTENDANCES, CREATE_ATTENDANCE, UPDATE_ATTENDANCE } from "../graphql/attendanceQueries";
import { GET_EMPLOYEES } from "../graphql/employeeQueries";


/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type AttendanceStatus = "Present" | "Absent" | "On Leave" | "Half Day" | "—";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function formatDayShort(iso: string): string {
  if (!iso) return "";
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return days[new Date(iso + "T00:00:00").getDay()];
}
function formatDayFull(iso: string): string {
  if (!iso) return "";
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(iso + "T00:00:00").getDay()];
}
function dateOffset(base: string, days: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function getInitials(f: string, l: string) {
  if (!f) return "??";
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}
function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${d}, ${y}`;
}
function toBackendStatus(s: AttendanceStatus): string {
  const map: Record<string, string> = {
    "Present":  "present",
    "Absent":   "absent",
    "On Leave": "on_leave",
    "Half Day": "half_day",
    "—":        "present" // default
  };
  return map[s] || "present";
}
interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  title: string;
  work_detail?: {
    department?: { name: string };
    designation?: { name: string };
  };
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_code: string;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  working_hours?: number;
  marked_by?: string;
  employee?: Employee;
}

interface AttendanceUpdateInput {
  status: string;
  check_in?: string;
  check_out?: string;
  working_hours?: number;
  employee_id?: string;
  employee_code?: string;
  date?: string;
  marked_by?: string;
}

function fromBackendStatus(s: string): AttendanceStatus {
  const map: Record<string, AttendanceStatus> = {
    "present":  "Present",
    "absent":   "Absent",
    "on_leave": "On Leave",
    "half_day": "Half Day",
    "late":     "Present", 
    "holiday":  "Present"
  };
  return map[s] || "—";
}
function calculateWorkingHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  try {
    const [h1, m1] = checkIn.split(":").map(Number);
    const [h2, m2] = checkOut.split(":").map(Number);
    const date1 = new Date(2000, 0, 1, h1, m1);
    const date2 = new Date(2000, 0, 1, h2, m2);
    let diff = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
    if (diff < 0) diff += 24; // Handle overnight
    return parseFloat(diff.toFixed(2));
  } catch {
    return 0;
  }
}
function to12(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ap}`;
}
function formatDesignation(d: string | { name: string } | undefined): string {
  if (!d) return "—";
  const name = typeof d === "string" ? d : d.name;
  if (!name) return "—";
  return name.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#1d4ed8","#059669","#7c3aed","#d97706",
  "#0891b2","#dc2626","#db2777","#0f766e",
  "#9333ea","#0284c7",
];

const TODAY = new Date().toISOString().split("T")[0];



/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .at-header   { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; gap:16px; }
  .at-title    { font-family:'DM Sans',sans-serif; font-size:22px; font-weight:700; color:#0f172a; letter-spacing:-0.5px; }
  .at-subtitle { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#64748b; margin-top:4px; }
  .at-header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }

  /* ── Date navigator pill ── */
  .at-date-nav {
    display:inline-flex; align-items:center;
    border:1.5px solid #e2e8f0; border-radius:10px;
    background:#fff; overflow:visible; position:relative;
  }
  .at-nav-arrow {
    width:34px; height:38px; border:none; background:transparent;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; transition:all 0.12s; flex-shrink:0; padding:0;
  }
  .at-nav-arrow:hover:not(:disabled) { background:#f8fafc; color:#0f172a; }
  .at-nav-arrow:disabled { color:#cbd5e1; cursor:not-allowed; }
  .at-nav-arrow svg { display:block; pointer-events:none; }
  .at-nav-sep { width:1px; height:20px; background:#e2e8f0; flex-shrink:0; }

  /* Clickable date label */
  .at-date-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:0 14px; height:38px; border:none; background:transparent;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#0f172a;
    cursor:pointer; white-space:nowrap; transition:background 0.12s;
  }
  .at-date-btn:hover { background:#f8fafc; }
  .at-date-btn svg { color:#64748b; display:block; flex-shrink:0; }
  .at-today-tag {
    font-family:'DM Sans',sans-serif; font-size:10px; font-weight:700;
    background:#1d4ed8; color:#fff; padding:2px 7px; border-radius:99px;
  }

  /* ── Calendar popover ── */
  .at-cal-anchor { position:relative; display:inline-flex; }
  .at-cal-pop {
    position:absolute; top:calc(100% + 10px); left:50%; transform:translateX(-50%);
    background:#fff; border:1px solid #e2e8f0; border-radius:14px;
    box-shadow:0 16px 40px rgba(15,23,42,.15), 0 2px 8px rgba(15,23,42,.07);
    padding:18px; z-index:300; width:280px;
    animation:calPopIn 0.17s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes calPopIn {
    from { opacity:0; transform:translateX(-50%) translateY(-8px) scale(.96); }
    to   { opacity:1; transform:translateX(-50%) translateY(0)     scale(1);  }
  }
  .at-cal-head {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;
  }
  .at-cal-month { font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; color:#0f172a; }
  .at-cal-arr {
    width:28px; height:28px; border-radius:7px; border:1px solid #e2e8f0;
    background:#f8fafc; display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; padding:0; transition:all 0.12s;
  }
  .at-cal-arr:hover:not(:disabled) { background:#f1f5f9; color:#0f172a; }
  .at-cal-arr:disabled { opacity:0.35; cursor:not-allowed; }
  .at-cal-arr svg { display:block; }

  .at-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .at-cal-dow {
    text-align:center; padding:3px 0 5px;
    font-family:'DM Sans',sans-serif; font-size:10px; font-weight:700;
    color:#94a3b8; letter-spacing:.05em; text-transform:uppercase;
  }
  .at-cal-cell {
    position:relative; text-align:center; padding:0; border:none; background:transparent;
    cursor:pointer; border-radius:7px; transition:background .1s, color .1s;
    font-family:'Inter',sans-serif; font-size:12.5px; font-weight:500; color:#334155;
    font-variant-numeric:tabular-nums; line-height:1; width:100%; aspect-ratio:1;
    display:flex; align-items:center; justify-content:center; flex-direction:column; gap:2px;
  }
  .at-cal-cell:hover:not(:disabled):not(.at-cal-selected) { background:#f1f5f9; color:#0f172a; }
  .at-cal-selected { background:#1d4ed8 !important; color:#fff !important; font-weight:700; }
  .at-cal-today:not(.at-cal-selected)  { color:#1d4ed8; font-weight:700; background:#eff6ff; }
  .at-cal-other   { color:#d1d5db; }
  .at-cal-cell:disabled { color:#e5e7eb; cursor:not-allowed; }
  /* Blue dot for dates with data */
  .at-cal-dot {
    width:4px; height:4px; border-radius:50%; background:#1d4ed8; flex-shrink:0;
  }
  .at-cal-selected .at-cal-dot { background:#93c5fd; }

  .at-cal-foot {
    margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9;
  }
  .at-cal-goto-today {
    width:100%; height:32px; border-radius:8px; border:none;
    background:#eff6ff; color:#1d4ed8;
    font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:700;
    cursor:pointer; transition:background .13s;
  }
  .at-cal-goto-today:hover { background:#dbeafe; }

  /* ── Buttons ── */
  .at-export-btn {
    display:inline-flex; align-items:center; gap:7px;
    height:38px; padding:0 16px; border-radius:9px;
    border:1.5px solid #e2e8f0; background:#fff;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#334155;
    cursor:pointer; transition:all .13s; white-space:nowrap;
  }
  .at-export-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }

  .at-mark-all-btn {
    display:inline-flex; align-items:center; gap:7px;
    height:38px; padding:0 16px; border-radius:9px; border:none;
    background:#1d4ed8; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700;
    cursor:pointer; transition:all .13s; white-space:nowrap;
    box-shadow:0 2px 8px rgba(29,78,216,.25);
  }
  .at-mark-all-btn:hover:not(:disabled) { background:#1e40af; box-shadow:0 4px 14px rgba(29,78,216,.35); }
  .at-mark-all-btn:disabled { background:#93c5fd; cursor:not-allowed; box-shadow:none; }

  /* ── Stat cards ── */
  .at-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:13px; margin-bottom:20px; }
  .at-stat-card {
    background:#fff; border:1px solid #e2e8f0; border-radius:12px;
    padding:15px 17px; box-shadow:0 1px 3px rgba(15,23,42,.05);
    display:flex; align-items:center; gap:13px;
    transition:box-shadow .14s, transform .14s;
  }
  .at-stat-card:hover { box-shadow:0 6px 18px rgba(15,23,42,.09); transform:translateY(-1px); }
  .at-stat-icon { width:40px; height:40px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .at-stat-val  { font-family:'Inter',sans-serif; font-size:24px; font-weight:700; line-height:1; letter-spacing:-1px; font-variant-numeric:tabular-nums; }
  .at-stat-lbl  { font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:500; color:#64748b; margin-top:3px; }
  .at-stat-pct  { font-family:'Inter',sans-serif; font-size:11px; font-weight:700; margin-top:2px; font-variant-numeric:tabular-nums; }

  /* ── Section card ── */
  .at-section {
    background:#fff; border:1px solid #e2e8f0; border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.04);
    overflow:hidden; margin-bottom:20px;
  }

  /* Past-date info bar */
  .at-past-bar {
    display:flex; align-items:center; gap:9px; padding:9px 18px;
    background:#fffbeb; border-bottom:1px solid #fde68a;
    font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:500; color:#92400e;
  }
  .at-past-bar svg { flex-shrink:0; }

  /* ── Toolbar ── */
  .at-toolbar {
    display:flex; align-items:center; gap:8px; flex-wrap:nowrap;
    padding:13px 18px; border-bottom:1px solid #f1f5f9;
  }
  .at-search-wrap { position:relative; flex:0 0 220px; }
  .at-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
  .at-search {
    width:100%; height:36px; padding:0 12px 0 35px;
    border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0f172a;
    background:#f8fafc; outline:none; transition:border-color .14s, box-shadow .14s;
  }
  .at-search::placeholder { color:#94a3b8; }
  .at-search:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.09); }
  .at-filter-select {
    height:36px; padding:0 28px 0 11px; border:1.5px solid #e2e8f0; border-radius:8px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#334155;
    background:#f8fafc; outline:none; cursor:pointer;
    -webkit-appearance:none; appearance:none; flex-shrink:0;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 9px center; transition:border-color .14s;
  }
  .at-filter-select:focus { border-color:#1d4ed8; }
  .at-bar-sep { width:1px; height:22px; background:#e2e8f0; flex-shrink:0; }
  .at-count { font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#64748b; margin-left:auto; white-space:nowrap; flex-shrink:0; }

  /* ── Table ── */
  .at-table-wrap { overflow-x:auto; }
  table.at-table { width:100%; border-collapse:collapse; }
  .at-table thead tr { background:#f8fafc; border-bottom:1.5px solid #e8edf5; }
  .at-table th {
    padding:11px 16px; text-align:left;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#64748b;
    letter-spacing:.07em; text-transform:uppercase; white-space:nowrap; user-select:none;
  }
  .at-table th:last-child { text-align:center; }
  .at-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background .1s; position:relative; }
  .at-table tbody tr:last-child { border-bottom:none; }
  .at-table tbody tr:hover { background:#fafbfe; }
  .at-table tbody tr.at-row-active { z-index:20; background:#f8fafc; }
  .at-table td { padding:12px 16px; vertical-align:middle; }
  .at-table td:last-child { text-align:center; }

  .at-emp-cell { display:flex; align-items:center; gap:10px; }
  .at-emp-av   { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700; color:#fff; }
  .at-emp-name { font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; color:#0f172a; white-space:nowrap; }
  .at-emp-id   { font-family:'Inter',sans-serif; font-size:11px; color:#94a3b8; margin-top:1px; font-variant-numeric:tabular-nums; }

  .at-dept-pill { display:inline-block; padding:3px 10px; border-radius:99px; background:#eff6ff; color:#1d4ed8; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:600; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .at-td-muted  { font-family:'DM Sans',sans-serif; color:#64748b; font-size:13px; font-weight:500; }

  .at-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; white-space:nowrap; }
  .at-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; opacity:.75; }
  .at-badge-present  { background:#f0fdf4; color:#15803d; }
  .at-badge-absent   { background:#fef2f2; color:#dc2626; }
  .at-badge-onleave  { background:#fffbeb; color:#b45309; }
  .at-badge-halfday  { background:#f0f9ff; color:#0369a1; }
  .at-badge-dash     { background:#f1f5f9; color:#64748b; }

  .at-time      { font-family:'Inter',sans-serif; font-size:12.5px; font-weight:600; color:#334155; font-variant-numeric:tabular-nums; }
  .at-time-dash { color:#cbd5e1; }

  /* ── Three-dot menu ── */
  .at-menu-wrap { position:relative; display:inline-flex; justify-content:center; }
  .at-menu-wrap.active { z-index:100; }
  .at-dots-btn {
    width:32px; height:32px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc;
    display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; color:#64748b; padding:0; transition:all .13s;
  }
  .at-dots-btn svg { display:block; pointer-events:none; }
  .at-dots-btn:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0f172a; }
  .at-dots-btn.open  { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
  .at-menu {
    position:absolute; top:calc(100% + 6px); right:0; z-index:150;
    background:#fff; border:1px solid #e2e8f0; border-radius:10px;
    box-shadow:0 10px 25px -5px rgba(15,23,42,0.12), 0 8px 10px -6px rgba(15,23,42,0.1);
    min-width:175px; padding:6px;
    animation:menuIn .15s cubic-bezier(.16,1,.3,1) both; transform-origin:top right;
  }
  @keyframes menuIn { from{opacity:0;transform:scale(.93) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .at-menu-item {
    display:flex; align-items:center; gap:9px; width:100%; padding:8px 11px; border-radius:7px; border:none;
    background:none; cursor:pointer; text-align:left;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#334155;
    transition:background .1s, color .1s;
  }
  .at-menu-item svg { display:block; flex-shrink:0; }
  .at-menu-item:hover  { background:#f8fafc; }
  .at-menu-item.green:hover { background:#f0fdf4; color:#15803d; }
  .at-menu-item.red:hover   { background:#fef2f2; color:#dc2626; }
  .at-menu-item.amber:hover { background:#fffbeb; color:#b45309; }
  .at-menu-item.blue:hover  { background:#eff6ff; color:#1d4ed8; }
  .at-menu-div { height:1px; background:#f1f5f9; margin:4px 5px; }

  /* ── Empty ── */
  .at-empty { padding:56px 24px; text-align:center; }
  .at-empty-icon { width:52px; height:52px; border-radius:14px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#94a3b8; }
  .at-empty p    { font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; color:#64748b; margin-bottom:4px; }
  .at-empty span { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#94a3b8; }

  /* ── Drawer ── */
  .at-drawer-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:100; animation:fadeIn .18s ease both; }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  .at-drawer {
    position:fixed; top:0; right:0; bottom:0; width:440px; background:#fff;
    z-index:101; display:flex; flex-direction:column;
    box-shadow:-8px 0 40px rgba(15,23,42,.14);
    animation:slideIn .22s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

  /* ── Toast ── */
  .at-toast {
    position:fixed; bottom:28px; right:28px; background:#0f172a; color:#fff;
    padding:12px 18px; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;
    display:flex; align-items:center; gap:9px;
    box-shadow:0 8px 24px rgba(0,0,0,.22); z-index:9999;
    animation:toastIn .28s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rowIn   { from{opacity:0;transform:translateY(4px)}  to{opacity:1;transform:translateY(0)} }
  .at-row-in { animation:rowIn .22s ease both; }
`;

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cls: Record<string, string> = {
    "Present":  "at-badge at-badge-present",
    "Absent":   "at-badge at-badge-absent",
    "On Leave": "at-badge at-badge-onleave",
    "Half Day": "at-badge at-badge-halfday",
    "—":        "at-badge at-badge-dash",
  };
  return <span className={cls[status] || cls["—"]}>{status}</span>;
}

/* ─────────────────────────────────────────────
   THREE-DOT MENU
───────────────────────────────────────────── */
function DotMenu({ onMark, onView, onToggle, currentStatus, readonly }: {
  onMark: (status: AttendanceStatus) => void;
  onView: () => void;
  onToggle: (open: boolean) => void;
  currentStatus: string;
  readonly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const act = (s: AttendanceStatus) => { onMark(s); setOpen(false); onToggle(false); };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle(next);
  };

  return (
    <div className={`at-menu-wrap${open ? " active" : ""}`} ref={ref}>
      <button className={`at-dots-btn${open ? " open" : ""}`} onClick={toggle}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>
        </svg>
      </button>
      {open && (
        <div className="at-menu">
          {!readonly && <>
            <button className={`at-menu-item green ${currentStatus === 'Present' ? 'active' : ''}`} onClick={() => act("Present")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Mark Present
            </button>
            <button className={`at-menu-item red ${currentStatus === 'Absent' ? 'active' : ''}`} onClick={() => act("Absent")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Mark Absent
            </button>
            <button className={`at-menu-item amber ${currentStatus === 'On Leave' ? 'active' : ''}`} onClick={() => act("On Leave")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8"  y1="2" x2="8"  y2="6"/><line x1="3"  y1="10" x2="21" y2="10"/></svg>
              Mark On Leave
            </button>
            <button className={`at-menu-item blue ${currentStatus === 'Half Day' ? 'active' : ''}`} onClick={() => act("Half Day")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Mark Half Day
            </button>
            <div className="at-menu-div"/>
            <button className="at-menu-item blue" onClick={() => { onView(); setOpen(false); onToggle(false); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/></svg>
              Time Entry
            </button>
            <div className="at-menu-div"/>
          </>}
          <button className="at-menu-item blue" onClick={() => { setOpen(false); onToggle(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/></svg>
            View Records
          </button>
        </div>
      )}
    </div>
  );
}



/* ─────────────────────────────────────────────
   MINI CALENDAR
───────────────────────────────────────────── */
function MiniCalendar({ selected, dateDots, onSelect, onClose }: {
  selected: string;
  dateDots: Set<string>;
  onSelect: (d: string) => void;
  onClose: () => void;
}) {
  const initDate = new Date(selected + "T00:00:00");
  const [vy, setVy] = useState(initDate.getFullYear());
  const [vm, setVm] = useState(initDate.getMonth());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW    = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInCur   = new Date(vy, vm + 1, 0).getDate();
  const daysInPrev  = new Date(vy, vm, 0).getDate();
  const nowDate     = new Date();
  const isMaxMonth  = vy === nowDate.getFullYear() && vm === nowDate.getMonth();

  const cells: { iso: string; n: number; cur: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const n = daysInPrev - i;
    const pm = vm === 0 ? 12 : vm;
    const py = vm === 0 ? vy - 1 : vy;
    cells.push({ iso: `${py}-${String(pm).padStart(2,"0")}-${String(n).padStart(2,"0")}`, n, cur: false });
  }
  for (let d = 1; d <= daysInCur; d++) {
    cells.push({ iso: `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, n: d, cur: true });
  }
  while (cells.length < 42) {
    const d = cells.length - firstDow - daysInCur + 1;
    const nm = vm === 11 ? 1 : vm + 2;
    const ny = vm === 11 ? vy + 1 : vy;
    cells.push({ iso: `${ny}-${String(nm).padStart(2,"0")}-${String(d).padStart(2,"0")}`, n: d, cur: false });
  }

  function prevM() { if (vm === 0) { setVm(11); setVy(y => y-1); } else setVm(m => m-1); }
  function nextM() { if (isMaxMonth) return; if (vm === 11) { setVm(0); setVy(y => y+1); } else setVm(m => m+1); }

  return (
    <div className="at-cal-pop" onClick={e => e.stopPropagation()}>
      <div className="at-cal-head">
        <button className="at-cal-arr" onClick={prevM}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="at-cal-month">{MONTHS[vm]} {vy}</span>
        <button className="at-cal-arr" onClick={nextM} disabled={isMaxMonth}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="at-cal-grid">
        {DOW.map(d => <div key={d} className="at-cal-dow">{d}</div>)}
        {cells.map(c => {
          const isFut = c.iso > TODAY;
          const isSel = c.iso === selected;
          const isTod = c.iso === TODAY;
          const hasDot = dateDots.has(c.iso) && !isFut;
          const cls = ["at-cal-cell",
            !c.cur  ? "at-cal-other"    : "",
            isSel   ? "at-cal-selected" : "",
            isTod && !isSel ? "at-cal-today" : "",
          ].filter(Boolean).join(" ");
          return (
            <button key={c.iso} className={cls} disabled={isFut || !c.cur}
              onClick={() => { onSelect(c.iso); onClose(); }}>
              {c.n}
              {hasDot && <span className="at-cal-dot"/>}
            </button>
          );
        })}
      </div>
      <div className="at-cal-foot">
        <button className="at-cal-goto-today" onClick={() => { onSelect(TODAY); onClose(); }}>
          Go to Today
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ATTENDANCE DRAWER
───────────────────────────────────────────── */
function AttendanceDrawer({ emp, onClose }: { emp: Employee; onClose: () => void }) {
  const { data } = useQuery<{ attendances: AttendanceRecord[] }>(GET_ATTENDANCES, {
    variables: { employee_id: emp.id }
  });
  
  const records = data?.attendances || [];
  const sorted = [...records].sort((a: AttendanceRecord, b: AttendanceRecord) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="at-drawer-overlay" onClick={onClose}/>
      <div className="at-drawer">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid #f1f5f9", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:"50%", background:"#1d4ed8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#fff" }}>
              {getInitials(emp.first_name, emp.last_name)}
            </div>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0f172a" }}>{emp.title} {emp.first_name} {emp.last_name}</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#94a3b8", marginTop:2, fontVariantNumeric:"tabular-nums" }}>{emp.employee_id}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, color:"#64748b", marginTop:1 }}>{emp.work_detail?.designation?.name || "N/A"} · {emp.work_detail?.department?.name || "N/A"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b", padding:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5, fontWeight:700, color:"#1d4ed8", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14, paddingBottom:8, borderBottom:"1px solid #eff6ff" }}>
            Attendance Records
          </div>
          {sorted.length === 0 ? (
             <div style={{ padding:"40px 0", textAlign:"center", color:"#94a3b8", fontSize:"13px" }}>No previous records found.</div>
          ) : sorted.map((rec, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderRadius:9, background:"#f8fafc", border:"1px solid #e8edf5", marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#0f172a" }}>
                  {formatDisplayDate(rec.date)}
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color:"#94a3b8", marginLeft:6 }}>{formatDayShort(rec.date)}</span>
                  {rec.date === TODAY && <span style={{ marginLeft:6, fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, background:"#1d4ed8", color:"#fff", padding:"1px 6px", borderRadius:99 }}>Today</span>}
                </div>
                {rec.check_in && (
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11.5, fontWeight:600, color:"#64748b", marginTop:3, fontVariantNumeric:"tabular-nums" }}>
                    {to12(rec.check_in)} → {to12(rec.check_out || "")}
                    {rec.working_hours && <span style={{ marginLeft:8, color:"#0891b2" }}>{rec.working_hours} hrs</span>}
                  </div>
                )}
              </div>
              <StatusBadge status={rec.status as AttendanceStatus}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   TIME ENTRY MODAL
 ───────────────────────────────────────────── */
function TimeEntryModal({ emp, date, record, onSave, onClose }: { 
  emp: Employee; 
  date: string; 
  record?: AttendanceRecord; 
  onSave: (input: AttendanceUpdateInput) => Promise<void>; 
  onClose: () => void 
}) {
  const [inTime, setInTime] = useState(record?.check_in || "09:00");
  const [outTime, setOutTime] = useState(record?.check_out || "17:00");
  const [loading, setLoading] = useState(false);

  const hours = calculateWorkingHours(inTime, outTime);

  const handleSave = async () => {
    setLoading(true);
    await onSave({
      check_in: inTime,
      check_out: outTime,
      working_hours: hours,
      status: record?.status || "present"
    });
    setLoading(false);
    onClose();
  };

  return (
    <>
      <div className="at-drawer-overlay" onClick={onClose} style={{ zIndex: 1000 }}/>
      <div className="at-cal-pop" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1001, width: 340, padding: 24 }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Time Entry</h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Updating hours for <strong>{emp.first_name} {emp.last_name}</strong> on {formatDisplayDate(date)}</p>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Check In Time</label>
          <input 
            type="time" 
            className="at-search" 
            style={{ paddingLeft: 12 }} 
            value={inTime} 
            onChange={e => setInTime(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Check Out Time</label>
          <input 
            type="time" 
            className="at-search" 
            style={{ paddingLeft: 12 }} 
            value={outTime} 
            onChange={e => setOutTime(e.target.value)}
          />
        </div>

        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total Working Hours</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>{hours} hrs</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="at-export-btn" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="at-mark-all-btn" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Times"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [calOpen, setCalOpen]           = useState(false);
  const [search, setSearch]             = useState("");
  const [deptFilter, setDeptFilter]     = useState("All");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "All">("All");
  const [detailEmp, setDetailEmp]       = useState<Employee | null>(null);
  const [timeEntryEmp, setTimeEntryEmp] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null);
  const [toast, setToast]               = useState("");
  const calRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: empData } = useQuery<{ getAllEmployees: { items: Employee[] } }>(GET_EMPLOYEES);
  const { data: attData, refetch: refetchAtt } = useQuery<{ attendances: { items: AttendanceRecord[] } }>(GET_ATTENDANCES, {
    variables: { from_date: selectedDate, to_date: selectedDate }
  });

  // Mutations
  const [createAttendance] = useMutation<{ createAttendance: AttendanceRecord }, { input: AttendanceUpdateInput }>(CREATE_ATTENDANCE);
  const [updateAttendance] = useMutation<{ updateAttendance: AttendanceRecord }, { id: string; input: AttendanceUpdateInput }>(UPDATE_ATTENDANCE);

  const employees = useMemo(() => empData?.getAllEmployees?.items || [], [empData]);
  const attendances = useMemo(() => attData?.attendances?.items || [], [attData]);

  /* Close calendar on outside click */
  useEffect(() => {
    if (!calOpen) return;
    const h = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [calOpen]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3200); }

  const isPast    = selectedDate < TODAY;
  const isToday   = selectedDate === TODAY;

  /* Navigate day */
  function goDay(d: number) {
    const next = dateOffset(selectedDate, d);
    if (next > TODAY) return;
    setSelectedDate(next);
  }

  /* Mark */
  async function handleMark(empId: string, empCode: string, status: AttendanceStatus) {
    if (isPast) return;
    
    const existing = attendances.find((a: AttendanceRecord) => a.employee_id === empId);
    const bStatus = toBackendStatus(status);
    
    try {
      if (existing) {
        await updateAttendance({
          variables: { id: existing.id, input: { status: bStatus } }
        });
      } else {
        await createAttendance({
          variables: {
            input: {
              employee_id: empId,
              employee_code: empCode,
              date: selectedDate,
              status: bStatus,
              marked_by: "HR Admin"
            }
          }
        });
      }
      refetchAtt();
      showToast(`Attendance marked as ${status}.`);
    } catch (err) {
      console.error(err);
      showToast("Error updating attendance.");
    }
  }

  async function handleMarkAllPresent() {
    if (isPast) return;
    showToast("Processing batch attendance...");
    
    try {
      for (const emp of filtered as Employee[]) {
        const existing = attendances.find((a: AttendanceRecord) => a.employee_id === emp.id);
        if (!existing) {
          await createAttendance({
            variables: {
              input: {
                employee_id: emp.id,
                employee_code: emp.employee_id,
                date: selectedDate,
                status: "present",
                check_in: "09:00",
                check_out: "17:00",
                working_hours: 8.0,
                marked_by: "HR Admin"
              }
            }
          });
        } else if (existing.status === "—" || !existing.status) {
           await updateAttendance({
             variables: { id: existing.id, input: { status: "present", check_in: "09:00", check_out: "17:00", working_hours: 8.0 } }
           });
        }
      }
      refetchAtt();
      showToast("All eligible employees marked as Present.");
    } catch (err) {
      console.error(err);
      showToast("Error marking all present.");
    }
  }

  /* Calendar dot data - Mocked for now to avoid heavy query */
  const dateDots = new Set<string>();

  /* Departments */
  const departments = useMemo(() => {
    const names = employees.map((e: Employee) => e.work_detail?.department?.name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))].sort() as string[];
  }, [employees]);

  /* Stats for selected date */
  const stats = useMemo(() => {
    const total   = employees.length;
    const present  = attendances.filter((a: AttendanceRecord) => a.status === "present" || a.status === "Present").length;
    const absent   = attendances.filter((a: AttendanceRecord) => a.status === "absent" || a.status === "Absent").length;
    const onLeave  = attendances.filter((a: AttendanceRecord) => a.status === "on_leave" || a.status === "On Leave").length;
    const halfDay  = attendances.filter((a: AttendanceRecord) => a.status === "half_day" || a.status === "Half Day").length;
    return { total, present, absent, onLeave, halfDay, pct: total ? Math.round(present/total*100) : 0 };
  }, [employees.length, attendances]);

  /* Filtered */
  const filtered = (() => {
    let list = [...employees];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e: Employee) => 
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) || 
        e.employee_id?.toLowerCase().includes(q) || 
        e.work_detail?.department?.name?.toLowerCase().includes(q) ||
        e.work_detail?.designation?.name?.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "All") list = list.filter((e: Employee) => e.work_detail?.department?.name === deptFilter);
    if (statusFilter !== "All") {
      list = list.filter((e: Employee) => {
        const att = attendances.find((a: AttendanceRecord) => a.employee_id === e.id);
        const status: AttendanceStatus = fromBackendStatus(att?.status || "—");
        return status === statusFilter;
      });
    }
    return list;
  })();

  const dayFull  = formatDayFull(selectedDate);
  const dateDisp = formatDisplayDate(selectedDate);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* ── Header ── */}
      <div className="at-header">
        <div>
          <h1 className="at-title">Attendance</h1>
          <p className="at-subtitle">Track and manage employee attendance by date.</p>
        </div>

        <div className="at-header-actions">

          {/* Date navigator */}
          <div className="at-date-nav">
            {/* ← previous day */}
            <button className="at-nav-arrow" onClick={() => goDay(-1)} title="Previous day">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div className="at-nav-sep"/>

            {/* Calendar anchor */}
            <div className="at-cal-anchor" ref={calRef}>
              <button
                className="at-date-btn"
                onClick={() => setCalOpen(v => !v)}
                title="Select date"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                {dayFull}, {dateDisp}
                {isToday && <span className="at-today-tag">Today</span>}
              </button>

              {calOpen && (
                <MiniCalendar
                  selected={selectedDate}
                  dateDots={dateDots}
                  onSelect={setSelectedDate}
                  onClose={() => setCalOpen(false)}
                />
              )}
            </div>

            <div className="at-nav-sep"/>
            {/* → next day */}
            <button className="at-nav-arrow" onClick={() => goDay(1)} disabled={isToday} title="Next day">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          <button className="at-export-btn" onClick={() => showToast("Exporting attendance as CSV…")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>

          <button className="at-mark-all-btn" onClick={handleMarkAllPresent} disabled={isPast}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Mark All Present
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="at-stats">
        {([
          { label:"Total",    value:stats.total,   pct:null,             color:"#1d4ed8", bg:"#eff6ff" },
          { label:"Present",  value:stats.present, pct:`${stats.pct}%`,  color:"#059669", bg:"#f0fdf4" },
          { label:"Absent",   value:stats.absent,  pct:stats.total?`${Math.round(stats.absent/stats.total*100)}%`:"0%",   color:"#dc2626", bg:"#fef2f2" },
          { label:"On Leave", value:stats.onLeave, pct:stats.total?`${Math.round(stats.onLeave/stats.total*100)}%`:"0%",  color:"#b45309", bg:"#fffbeb" },
          { label:"Half Day", value:stats.halfDay, pct:stats.total?`${Math.round(stats.halfDay/stats.total*100)}%`:"0%",  color:"#0369a1", bg:"#f0f9ff" },
        ] as const).map(s => (
          <div key={s.label} className="at-stat-card">
            <div className="at-stat-icon" style={{ background:s.bg }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="at-stat-val" style={{ color:s.color }}>{s.value}</div>
              <div className="at-stat-lbl">{s.label}</div>
              {s.pct && <div className="at-stat-pct" style={{ color:s.color }}>{s.pct}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Section ── */}
      <div className="at-section">

        {/* Past-date read-only banner */}
        {isPast && (
          <div className="at-past-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Viewing attendance for&nbsp;<strong>{dayFull}, {dateDisp}</strong>&nbsp;— past records are read-only.
          </div>
        )}

        {/* Toolbar */}
        <div className="at-toolbar">
          <div className="at-search-wrap">
            <span className="at-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input className="at-search" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="at-bar-sep"/>
          <select className="at-filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {departments.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
          </select>
          <select className="at-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as AttendanceStatus | "All")}>
            <option value="All">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
          <span className="at-count">{filtered.length} of {employees.length}</span>
        </div>

        {/* Table */}
        <div className="at-table-wrap">
          {filtered.length === 0 ? (
            <div className="at-empty">
              <div className="at-empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p>No employees found</p>
              <span>Try adjusting the search or filters.</span>
            </div>
          ) : (
            <table className="at-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp: Employee, idx) => {
                  const rec    = attendances.find((a: AttendanceRecord) => a.employee_id === emp.id);
                  const status: AttendanceStatus = fromBackendStatus(rec?.status || "—");
                  const isMenuOpen = openMenuId === emp.id;

                  return (
                    <tr key={emp.id} className={`${idx < 5 ? "at-row-in" : ""} ${isMenuOpen ? "at-row-active" : ""}`}>
                      <td>
                        <div className="at-emp-cell">
                          <div className="at-emp-av" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                            {getInitials(emp.first_name, emp.last_name)}
                          </div>
                          <div>
                            <div className="at-emp-name">{emp.title} {emp.first_name} {emp.last_name}</div>
                            <div className="at-emp-id">{emp.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="at-dept-pill">{emp.work_detail?.department?.name || "N/A"}</span></td>
                      <td className="at-td-muted">{formatDesignation(emp.work_detail?.designation)}</td>
                      <td><StatusBadge status={status}/></td>
                      <td><span className={`at-time${!rec?.check_in ? " at-time-dash" : ""}`}>{rec?.check_in ? to12(rec.check_in) : "—"}</span></td>
                      <td><span className={`at-time${!rec?.check_out ? " at-time-dash" : ""}`}>{rec?.check_out ? to12(rec.check_out) : "—"}</span></td>
                      <td><span className={`at-time${!rec?.working_hours ? " at-time-dash" : ""}`}>{rec?.working_hours || "—"}</span></td>
                      <td>
                        <DotMenu 
                          onMark={(s) => handleMark(emp.id, emp.employee_id, s)}
                          onView={() => setTimeEntryEmp(emp)}
                          onToggle={(op) => setOpenMenuId(op ? emp.id : null)}
                          currentStatus={status}
                          readonly={isPast} 
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detailEmp && <AttendanceDrawer emp={detailEmp} onClose={() => setDetailEmp(null)}/>}

      {timeEntryEmp && (
        <TimeEntryModal 
          emp={timeEntryEmp}
          date={selectedDate}
          record={attendances.find((a: AttendanceRecord) => a.employee_id === timeEntryEmp.id)}
          onClose={() => setTimeEntryEmp(null)}
          onSave={async (input) => {
            const existing = attendances.find((a: AttendanceRecord) => a.employee_id === timeEntryEmp.id);
            try {
              if (existing) {
                await updateAttendance({ variables: { id: existing.id, input } });
              } else {
                await createAttendance({
                  variables: {
                    input: {
                      ...input,
                      employee_id: timeEntryEmp.id,
                      employee_code: timeEntryEmp.employee_id,
                      date: selectedDate,
                      marked_by: "HR Admin"
                    }
                  }
                });
              }
              refetchAtt();
              showToast("Time record updated.");
            } catch (err) {
              console.error(err);
              showToast("Error updating time.");
            }
          }}
        />
      )}

      {toast && (
        <div className="at-toast">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}
    </>
  );
}
