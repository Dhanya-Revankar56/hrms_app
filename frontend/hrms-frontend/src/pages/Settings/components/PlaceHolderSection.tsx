// src/components/settings/PlaceholderSection.tsx
// Generic placeholder used for sections not yet implemented.
// Replace each one with its own full component when ready.

import React from "react";

interface PlaceholderSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor?: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  .ph-wrap {
    text-align: center;
    padding: 64px 32px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(15,23,42,.05);
  }

  .ph-icon-ring {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
    color: #94a3b8;
  }

  .ph-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .ph-desc {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #94a3b8;
    margin-bottom: 20px;
  }

  .ph-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 99px;
    background: #f1f5f9;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
    border: 1px solid #e2e8f0;
  }
`;

export default function PlaceholderSection({
  title,
  description,
  icon,
}: PlaceholderSectionProps) {
  return (
    <>
      <style>{CSS}</style>
      <div className="ph-wrap">
        <div className="ph-icon-ring">{icon}</div>
        <div className="ph-title">{title}</div>
        <div className="ph-desc">{description}</div>
        <span className="ph-badge">Coming soon</span>
      </div>
    </>
  );
}
