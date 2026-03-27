// src/layout/DashboardLayout.tsx

import  { useState, useEffect, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
const currentUser = {
  name: "Admin",
  role: "HR Administrator",
  initials: "A"
};

const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');

  :root {
    --sidebar-w:      232px;
    --topbar-h:       60px;
    --sidebar-bg:     #0f2545;
    --sidebar-hover:  rgba(255,255,255,.07);
    --sidebar-active: rgba(255,255,255,.12);
    --accent:         #1d4ed8;
    --accent-light:   #60a5fa;
    --content-bg:     #f1f5f9;
    --white:          #ffffff;
    --border:         #e2e8f0;
    --text-primary:   #0f172a;
    --text-muted:     #64748b;
    --text-faint:     #94a3b8;
    --radius:         12px;
    --shadow-sm:      0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04);
    --shadow-md:      0 4px 6px -1px rgba(15,23,42,.07), 0 2px 4px -1px rgba(15,23,42,.04);
    --shadow-lg:      0 10px 15px -3px rgba(15,23,42,.08), 0 4px 6px -2px rgba(15,23,42,.04);
  }

  /* ══════════════════════════════════════
     DARK THEME GLOBALS (Slate Theme)
  ══════════════════════════════════════ */
  html[data-theme="dark"] {
    --sidebar-bg:     #1e293b;
    --sidebar-hover:  rgba(255,255,255,.07);
    --sidebar-active: rgba(255,255,255,.12);
    --content-bg:     #0f172a;
    --white:          #1e293b;
    --border:         #334155;
    --text-primary:   #f8fafc;
    --text-muted:     #94a3b8;
    --text-faint:     #64748b;
    --accent:         #3b82f6;
    --accent-light:   #60a5fa;
  }

  html[data-theme="dark"] .card, 
  html[data-theme="dark"] .dc-card,
  html[data-theme="dark"] .settings-card,
  html[data-theme="dark"] .em-drawer,
  html[data-theme="dark"] .ob-section,
  html[data-theme="dark"] .ob-section-header,
  html[data-theme="dark"] .em-table-card,
  html[data-theme="dark"] .em-section-group,
  html[data-theme="dark"] .em-drawer-header,
  html[data-theme="dark"] .em-drawer-body,
  html[data-theme="dark"] .em-drawer-footer,
  html[data-theme="dark"] .em-filter-bar,
  html[data-theme="dark"] .em-pagination,
  html[data-theme="dark"] .em-stat-card,
  html[data-theme="dark"] .lv-section,
  html[data-theme="dark"] .lv-stat-card,
  html[data-theme="dark"] .lv-table thead tr,
  html[data-theme="dark"] .at-stat-card,
  html[data-theme="dark"] .er-stat-card,
  html[data-theme="dark"] .lv-drawer {
    background: var(--white) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
  }

  html[data-theme="dark"] .ob-label,
  html[data-theme="dark"] .em-view-label,
  html[data-theme="dark"] .lv-field-label,
  html[data-theme="dark"] .ob-section-title,
  html[data-theme="dark"] .em-section-title,
  html[data-theme="dark"] .lv-form-title {
    color: var(--text-muted) !important;
  }

  html[data-theme="dark"] {
    color-scheme: dark;
  }

  html[data-theme="dark"] th {
    background: #0f172a !important;
    color: var(--text-muted) !important;
    border-bottom-color: var(--border) !important;
  }
  
  html[data-theme="dark"] td {
    border-bottom-color: var(--border) !important;
    color: var(--text-primary) !important;
  }

  html[data-theme="dark"] input, 
  html[data-theme="dark"] select,
  html[data-theme="dark"] textarea {
    background: #0f172a !important;
    color: var(--text-primary) !important;
    border-color: var(--border) !important;
  }

  html[data-theme="dark"] .topbar-user {
    background: #334155 !important;
    border-color: #475569 !important;
  }

  html[data-theme="dark"] .tenant-select {
    background: #064e3b !important;
    border-color: #065f46 !important;
    color: #34d399 !important;
  }

  html[data-theme="dark"] .topbar-bell {
    background: #1e293b !important;
    border-color: var(--border) !important;
    color: var(--text-muted) !important;
  }
  
  html[data-theme="dark"] .topbar-bell:hover {
    background: #334155 !important;
    color: var(--text-primary) !important;
  }

  html[data-theme="dark"] .notif-dropdown {
    background: #1e293b !important;
    border-color: var(--border) !important;
  }
  
  html[data-theme="dark"] .notif-item {
    border-bottom-color: var(--border) !important;
  }
  
  html[data-theme="dark"] .notif-item:hover {
    background: #334155 !important;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--content-bg);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* ══════════════════════════════════════
     APP SHELL
  ══════════════════════════════════════ */
  .app-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ══════════════════════════════════════
     SIDEBAR
  ══════════════════════════════════════ */
  .sidebar {
    width: var(--sidebar-w);
    min-width: var(--sidebar-w);
    background: var(--sidebar-bg);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    position: relative;
    z-index: 20;
    box-shadow: 1px 0 0 rgba(255,255,255,.04), 4px 0 16px rgba(0,0,0,.18);
  }

  .sidebar::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 160px; height: 160px;
    background: radial-gradient(circle at top right, rgba(29,78,216,.18), transparent 70%);
    pointer-events: none;
  }

  .sb-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
  }

  .sb-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .sb-brand-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.16);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.07);
  }

  .sb-brand-name {
    font-size: 17px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.4px;
  }

  .sb-brand-name span { color: var(--accent-light); }

  .sb-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px 12px;
    scrollbar-width: none;
  }
  .sb-nav::-webkit-scrollbar { display: none; }

  .sb-section-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,.22);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 16px 10px 6px;
  }

  .sb-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    margin-bottom: 1px;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,.48);
    transition: background 0.14s, color 0.14s;
    cursor: pointer;
    position: relative;
  }

  .sb-nav-item:hover {
    background: var(--sidebar-hover);
    color: rgba(255,255,255,.82);
  }

  .sb-nav-item.active {
    background: var(--sidebar-active);
    color: #fff;
    font-weight: 600;
  }

  .sb-nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    background: var(--accent-light);
    border-radius: 0 3px 3px 0;
  }

  .sb-nav-item svg { flex-shrink: 0; opacity: .75; }
  .sb-nav-item.active svg { opacity: 1; }
  .sb-nav-item:hover svg { opacity: .9; }

  .sb-footer {
    padding: 12px 10px 16px;
    border-top: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
  }

  .sb-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.14s;
  }

  .sb-user:hover { background: var(--sidebar-hover); }

  .sb-user-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 11.5px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    border: 2px solid rgba(255,255,255,.15);
  }

  .sb-user-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,.82);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sb-user-role {
    font-size: 10.5px;
    color: rgba(255,255,255,.3);
    margin-top: 1px;
  }

  .sb-user-chevron {
    margin-left: auto;
    color: rgba(255,255,255,.2);
    flex-shrink: 0;
  }

  .sb-user-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 10px;
    width: calc(100% - 20px);
    background: #1e293b;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    padding: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,.3);
    z-index: 50;
    animation: slideUp 0.15s ease-out forwards;
  }

  .sb-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    color: rgba(255,255,255,.8);
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .sb-menu-item:hover {
    background: rgba(255,255,255,.08);
    color: #fff;
  }
  
  .sb-menu-item.danger {
    color: #f87171;
  }
  
  .sb-menu-item.danger:hover {
    background: rgba(239,68,68,.1);
    color: #fca5a5;
  }

  /* ══════════════════════════════════════
     MAIN AREA
  ══════════════════════════════════════ */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: calc(100vw - var(--sidebar-w));
    overflow: hidden;
  }

  /* ══════════════════════════════════════
     TOPBAR
  ══════════════════════════════════════ */
  .topbar {
    height: var(--topbar-h);
    min-height: var(--topbar-h);
    background: var(--white);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    position: relative;
    z-index: 10;
  }

  .topbar-left { display: flex; flex-direction: column; gap: 1px; }

  .topbar-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }

  .topbar-breadcrumb {
    font-size: 12px;
    color: var(--text-faint);
    font-weight: 400;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .topbar-bell-wrap {
    position: relative;
  }

  .topbar-bell {
    position: relative;
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: #f8fafc;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: background 0.13s, border-color 0.13s;
  }

  .topbar-bell:hover {
    background: #eef2f7;
    border-color: #cbd5e1;
    color: var(--text-primary);
  }

  .topbar-bell-dot {
    position: absolute;
    top: 7px; right: 7px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ef4444;
    border: 1.5px solid var(--white);
  }

  /* Notification dropdown */
  .notif-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 280px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(15,23,42,.12);
    z-index: 50;
    overflow: hidden;
    animation: notifIn 0.15s cubic-bezier(.16,1,.3,1) both;
  }

  @keyframes notifIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .notif-header {
    padding: 12px 16px 8px;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-faint);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid #f1f5f9;
  }

  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid #f8fafc;
    transition: background 0.1s;
  }

  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: #f8fafc; }

  .notif-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent);
    margin-top: 5px;
    flex-shrink: 0;
  }

  .notif-text {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.45;
  }

  .notif-time {
    font-size: 11px;
    color: var(--text-faint);
    margin-top: 2px;
  }

  .topbar-user {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 5px 12px 5px 5px;
    border-radius: 99px;
    border: 1px solid var(--border);
    background: #f8fafc;
    cursor: pointer;
    transition: background 0.13s;
  }

  .topbar-tenant {
    margin-right: 8px;
  }

  .tenant-select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #f0fdf4;
    font-size: 13px;
    font-weight: 700;
    color: #166534;
    cursor: pointer;
    font-family: inherit;
    outline: none;
    transition: all 0.2s;
  }

  .tenant-select:hover {
    background: #dcfce7;
    border-color: #bbf7d0;
  }

  .topbar-user:hover { background: #eef2f7; }

  .topbar-user-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .topbar-user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* ══════════════════════════════════════
     PAGE CONTENT AREA
  ══════════════════════════════════════ */
  .page-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 40px;
    background: var(--content-bg);
    width: 100%;
    box-sizing: border-box;
  }

  .page-content::-webkit-scrollbar { width: 5px; }
  .page-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 99px;
  }

  /* ══════════════════════════════════════
     SHARED CARD SHELL
  ══════════════════════════════════════ */
  .card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.1px;
  }

  .card-action {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.13s;
    padding: 0;
  }

  .card-action:hover { color: #1e40af; }

  /* ══════════════════════════════════════
     DASHBOARD CARD
  ══════════════════════════════════════ */
  .dc-card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    padding: 20px 20px 0;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.15s, transform 0.15s;
    cursor: default;
  }

  .dc-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-1px);
  }

  .dc-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .dc-icon-box {
    width: 42px; height: 42px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .dc-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-align: right;
    line-height: 1.3;
    max-width: 80px;
  }

  .dc-value {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1;
    font-family: 'DM Mono', monospace;
    margin-bottom: 8px;
  }

  .dc-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 500;
    padding-bottom: 18px;
  }

  .dc-accent {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    opacity: .55;
  }

  /* ══════════════════════════════════════
     ANIMATIONS
  ══════════════════════════════════════ */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .anim-up { animation: slideUp 0.35s cubic-bezier(.16,1,.3,1) both; }
  .d1 { animation-delay: .04s; }
  .d2 { animation-delay: .08s; }
  .d3 { animation-delay: .12s; }
  .d4 { animation-delay: .16s; }
  .d5 { animation-delay: .20s; }
  .d6 { animation-delay: .24s; }
  .d7 { animation-delay: .28s; }
  .d8 { animation-delay: .32s; }
`;

/* ─────────────────────────────────────────────
   NAV ITEMS
───────────────────────────────────────────── */
interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const IcoSize = {
  width: 16, height: 16,
  fill: "none", viewBox: "0 0 24 24",
  stroke: "currentColor", strokeWidth: 1.9,
} as const;

const NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg {...IcoSize}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    path: "/onboarding",
    label: "Employee Onboarding",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    path: "/employees",
    label: "Employee Management",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6-4a4 4 0 11-6.32-3.26" />
      </svg>
    ),
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    path: "/leave",
    label: "Leave Management",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: "/movement",
    label: "Movement Register",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    path: "/relieving",
    label: "Relieving",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    path: "/register",
    label: "Event Register",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
 {
    path: "/reports",
    label: "Reports & Analytics",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    path: "/holidays",
    label: "Holidays",
    icon: (
      <svg {...IcoSize}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },

  {
  path: "/settings",
  label: "Settings",
  icon: (
    <svg {...IcoSize}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317a1 1 0 011.35-.447l1.518.876a1 1 0 001.093-.049l1.3-1.04a1 1 0 011.447.18l1.2 1.6a1 1 0 01-.18 1.447l-1.04 1.3a1 1 0 00-.049 1.093l.876 1.518a1 1 0 01-.447 1.35l-1.8.9a1 1 0 00-.553.894l-.18 1.7a1 1 0 01-.993.9h-2a1 1 0 01-.993-.9l-.18-1.7a1 1 0 00-.553-.894l-1.8-.9a1 1 0 01-.447-1.35l.876-1.518a1 1 0 00-.049-1.093l-1.04-1.3a1 1 0 01-.18-1.447l1.2-1.6a1 1 0 011.447-.18l1.3 1.04a1 1 0 001.093.049l1.518-.876z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}
];




/* ─────────────────────────────────────────────
   MOCK NOTIFICATIONS
───────────────────────────────────────────── */
const NOTIFICATIONS = [
  { id: 1, text: "Rahul Sharma completed onboarding", time: "2 min ago" },
  { id: 2, text: "3 leave requests pending approval", time: "1 hr ago" },
  { id: 3, text: "Priya Verma's documents approved",  time: "3 hr ago" },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [tenant, setTenant] = useState(localStorage.getItem('institution_id') || 'COLLEGE_A');

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenant = e.target.value;
    localStorage.setItem('institution_id', newTenant);
    setTenant(newTenant);
    // Reload page to clear Apollo cache and fetch new tenant data
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('institution_id');
    navigate('/');
  };

  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem("hrms_theme") || "system";
      let activeTheme = savedTheme;
      if (savedTheme === "system") {
        activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      document.documentElement.setAttribute("data-theme", activeTheme);
    };

    applyTheme();

    const handleThemeChange = () => applyTheme();
    window.addEventListener("theme_changed", handleThemeChange);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (localStorage.getItem("hrms_theme") === "system") {
        applyTheme();
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("theme_changed", handleThemeChange);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  const activeNav = NAV_ITEMS.find((n: NavItem) => location.pathname.startsWith(n.path));
  const pageTitle = activeNav?.label ?? "Dashboard";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LAYOUT_CSS }} />

      <div className="app-shell">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">

          <div className="sb-header">
            <div className="sb-brand">
              <div className="sb-brand-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                  stroke="rgba(255,255,255,.88)" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0121 20.055a11.952 11.952 0 01-9 0 11.952 11.952 0 01-9-3.422L12 14z" />
                </svg>
              </div>
              <span className="sb-brand-name">Campus<span>HR</span></span>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="sb-section-label">Menu</div>
            {NAV_ITEMS.map((item: NavItem) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }: { isActive: boolean }) =>
                  `sb-nav-item${isActive ? " active" : ""}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sb-footer" style={{ position: 'relative' }}>
            <div className="sb-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="sb-user-avatar">{currentUser.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sb-user-name">{currentUser.name}</div>
                <div className="sb-user-role">{currentUser.role}</div>
              </div>
              <svg className="sb-user-chevron" width="14" height="14"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </div>

            {userMenuOpen && (
              <div className="sb-user-menu">
                <div className="sb-menu-item danger" onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* ── MAIN AREA ── */}
        <div className="main-area">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <h1 className="topbar-title" style={{ fontSize: '15px', fontWeight: 700 }}>
                CampusHR &rsaquo; <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{pageTitle}</span>
              </h1>
            </div>

            <div className="topbar-right">

              {/* Notification bell with dropdown */}
              <div className="topbar-bell-wrap">
                <button
                  className="topbar-bell"
                  onClick={() => setNotifOpen((v: boolean) => !v)}
                  aria-label="Notifications"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.9} style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <div className="topbar-bell-dot" style={{ background: '#ef4444', border: '2px solid var(--white)' }} />
                </button>

                {/* Dropdown — only renders when notifOpen is true */}
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">Notifications</div>
                    {NOTIFICATIONS.map((n) => (
                      <div key={n.id} className="notif-item">
                        <div className="notif-dot" />
                        <div>
                          <div className="notif-text">{n.text}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tenant Switcher */}
              <div className="topbar-tenant">
                <select className="tenant-select" value={tenant} onChange={handleTenantChange} title="Switch active institution">
                  <option value="COLLEGE_A">🏫 Campus Alpha</option>
                  <option value="COLLEGE_B">🏫 Campus Beta</option>
                </select>
              </div>

              {/* User chip */}
              <div className="topbar-user">
                <div className="topbar-user-avatar">{currentUser.initials}</div>
                <span className="topbar-user-name">{currentUser.name}</span>
              </div>

            </div>
          </header>

          {/* Page content */}
          <main className="page-content">
            {children}
          </main>

        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(notifOpen || userMenuOpen) && (
        <div
          onClick={() => {
            setNotifOpen(false);
            setUserMenuOpen(false);
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
          }}
        />
      )}
    </>
  );
}
