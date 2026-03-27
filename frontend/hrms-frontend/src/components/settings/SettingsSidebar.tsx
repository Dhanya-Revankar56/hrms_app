// src/components/settings/SettingsSidebar.tsx

import React from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface SidebarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface SettingsSidebarProps {
  items: SidebarItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

  .stg-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--white, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(15,23,42,.05);
    overflow: hidden;
    align-self: flex-start;
    position: sticky;
    top: 20px;
  }

  .stg-sidebar-head {
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--border, #f1f5f9);
  }

  .stg-sidebar-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-faint, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .stg-sidebar-nav {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stg-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    transition: background 0.12s;
  }
  .stg-nav-item:hover { background: var(--sidebar-hover, #f8fafc); }

  .stg-nav-item.active {
    background: var(--sidebar-active, #eff6ff);
  }

  .stg-nav-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--sidebar-bg, #f1f5f9);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-muted, #64748b);
    transition: background 0.12s, color 0.12s;
  }
  .stg-nav-item.active .stg-nav-icon {
    background: var(--accent-light, #dbeafe);
    color: var(--accent, #1d4ed8);
  }

  .stg-nav-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: var(--text-primary, #334155);
    transition: color 0.12s;
  }
  .stg-nav-item.active .stg-nav-label {
    font-weight: 500;
    color: var(--accent, #1d4ed8);
  }

  .stg-nav-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent, #1d4ed8);
    margin-left: auto;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .stg-nav-item.active .stg-nav-indicator { opacity: 1; }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function SettingsSidebar({ items, activeKey, onChange }: SettingsSidebarProps) {
  return (
    <>
      <style>{CSS}</style>
      <aside className="stg-sidebar">
        <div className="stg-sidebar-head">
          <div className="stg-sidebar-title">Configuration</div>
        </div>
        <nav className="stg-sidebar-nav">
          {items.map((item) => (
            <button
              key={item.key}
              className={`stg-nav-item${activeKey === item.key ? " active" : ""}`}
              onClick={() => onChange(item.key)}
            >
              <span className="stg-nav-icon">{item.icon}</span>
              <span className="stg-nav-label">{item.label}</span>
              <span className="stg-nav-indicator" />
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
