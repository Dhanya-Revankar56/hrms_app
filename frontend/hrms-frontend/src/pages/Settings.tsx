// src/pages/Settings.tsx

import { useState } from "react";
import SettingsSidebar from "../components/settings/SettingsSidebar";
import type { SidebarItem } from "../components/settings/SettingsSidebar";
import DepartmentsSection from "../components/settings/DepartmentSection";
import LeaveTypesSection from "../components/settings/LeaveTypesSection";
import DesignationSection from "../components/settings/DesignationSection";
import CategorySection from "../components/settings/CategorySection";
import EmployeeTypeSection from "../components/settings/EmployeeTypeSection";
import UserManagementSection from "../components/settings/UserManagementSection";
import AppearanceSection from "../components/settings/AppearanceSection";
import InstitutionSection from "../components/settings/InstitutionSection";
import MovementRegisterSection from "../components/settings/MovementRegisterSection";
import SecuritySection from "../components/settings/SecuritySection";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const icons = {
  departments: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 22V12h6v10M9 7h.01M15 7h.01"/>
    </svg>
  ),
  leaveTypes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  ),
  designations: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  employeeTypes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  categories: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M7 8h10M7 12h10M7 16h10"/>
    </svg>
  ),
  appearance: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  institution: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 0 1 4 0v4"/>
    </svg>
  ),
  movement: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  security: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   SIDEBAR CONFIG
   To add a new section: add an entry here + a
   case in renderSection() below. That's it.
───────────────────────────────────────────── */
const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    key: "institution",
    label: "Institution",
    icon: icons.institution,
    description: "Manage organization details",
  },
  {
    key: "departments",
    label: "Departments",
    icon: icons.departments,
    description: "Manage organisation departments",
  },
  {
    key: "leave-types",
    label: "Leave Types",
    icon: icons.leaveTypes,
    description: "Configure leave categories",
  },
  {
    key: "designations",
    label: "Designations",
    icon: icons.designations,
    description: "Manage employee designations",
  },
  {
    key: "employee-types",
    label: "Employee Types",
    icon: icons.employeeTypes,
    description: "Define employment categories",
  },
  {
    key: "categories",
    label: "Employee Categories",
    icon: icons.categories,
    description: "Manage employee categories",
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: icons.appearance,
    description: "Light, dark, and system themes",
  },
  {
    key: "users",
    label: "User Management",
    icon: icons.users,
    description: "Manage roles and access privileges",
  },
  {
    key: "movement-register",
    label: "Movement Register",
    icon: icons.movement,
    description: "Configure movement rules and limits",
  },
  {
    key: "security",
    label: "Security",
    icon: icons.security,
    description: "Update your login password",
  },
];

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

  .settings-page {
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Page header ── */
  .settings-page-header {
    margin-bottom: 22px;
  }

  .settings-breadcrumb {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-faint);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .settings-breadcrumb span { color: var(--border); }

  .settings-page-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }

  .settings-page-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: var(--text-muted);
    margin-top: 3px;
  }

  /* ── Layout ── */
  .settings-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .settings-content {
    flex: 1;
    min-width: 0;
  }
`;

/* ─────────────────────────────────────────────
   SECTION RENDERER
   Add a new case here when building a new section.
───────────────────────────────────────────────────── */
function renderSection(key: string) {
  switch (key) {
    case "institution":
      return <InstitutionSection />;

    case "departments":
      return <DepartmentsSection />;

    case "leave-types":
      return <LeaveTypesSection />;

    case "designations":
      return <DesignationSection />;

    case "employee-types":
      return <EmployeeTypeSection />;

    case "categories":
      return <CategorySection />;

    case "users":
      return <UserManagementSection />;

    case "appearance":
      return <AppearanceSection />;

    case "movement-register":
      return <MovementRegisterSection />;

    case "security":
      return <SecuritySection />;

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function Settings() {
  const [activeKey, setActiveKey] = useState("departments");

  return (
    <>
      <style>{CSS}</style>

      <div className="settings-page">
        {/* ── Page Header ── */}
        <div className="settings-page-header">
          <div className="settings-page-sub">
            Manage your organisation's configuration and master data.
          </div>
        </div>

        {/* ── Sidebar + Content Layout ── */}
        <div className="settings-layout">
          <SettingsSidebar
            items={SIDEBAR_ITEMS}
            activeKey={activeKey}
            onChange={setActiveKey}
          />

          <div className="settings-content">
            {renderSection(activeKey)}
          </div>
        </div>
      </div>
    </>
  );
}
