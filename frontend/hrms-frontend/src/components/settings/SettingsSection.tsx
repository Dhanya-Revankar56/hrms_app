// src/components/settings/SettingsSection.tsx

import React from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

  .ss-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.04);
    overflow: hidden;
    margin-bottom: 20px;
  }

  .ss-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 22px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .ss-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #1d4ed8;
  }

  .ss-header-text {}

  .ss-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    line-height: 1.3;
  }

  .ss-desc {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
    margin-top: 2px;
  }

  .ss-body {
    padding: 20px 22px;
  }
`;

export default function SettingsSection({
  title,
  description,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <>
      <style>{CSS}</style>
      <div className="ss-card">
        <div className="ss-header">
          {icon && <div className="ss-icon">{icon}</div>}
          <div className="ss-header-text">
            <div className="ss-title">{title}</div>
            {description && <div className="ss-desc">{description}</div>}
          </div>
        </div>
        <div className="ss-body">{children}</div>
      </div>
    </>
  );
}
