// src/components/settings/AppearanceSection.tsx

import { useState } from "react";

export type ThemeOption = "light" | "dark" | "system";

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeOption>(() => {
    const saved = localStorage.getItem("hrms_theme") as ThemeOption;
    if (saved && ["light", "dark", "system"].includes(saved)) {
      return saved;
    }
    return "system";
  });

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    localStorage.setItem("hrms_theme", newTheme);
    // Dispatch a custom event so other components (like DashboardLayout) can pick up the change immediately
    window.dispatchEvent(new Event("theme_changed"));
  };

  return (
    <div className="settings-card">
      <div className="sc-header">
        <h2 className="sc-title">Appearance</h2>
        <p className="sc-desc">Customize how CampusHR looks on your device.</p>
      </div>

      <div
        className="sc-body"
        style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}
      >
        {/* Light Theme Option */}
        <div
          onClick={() => handleThemeChange("light")}
          style={{
            flex: 1,
            minWidth: "200px",
            cursor: "pointer",
            border:
              theme === "light" ? "2px solid #1d4ed8" : "2px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px",
            background: "var(--white)",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Mockup of UI */}
            <div
              style={{
                height: "24px",
                background: "#0f2545",
                width: "30%",
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
              }}
            />
            <div
              style={{
                height: "12px",
                background: "#ffffff",
                width: "70%",
                position: "absolute",
                right: 0,
                top: 0,
                borderBottom: "1px solid #e2e8f0",
              }}
            />
          </div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Light Mode
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Clean and bright, perfect for daytime use.
          </div>

          {theme === "light" && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                color: "#007acc",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )}
        </div>

        {/* Dark Theme Option */}
        <div
          onClick={() => handleThemeChange("dark")}
          style={{
            flex: 1,
            minWidth: "200px",
            cursor: "pointer",
            border:
              theme === "dark"
                ? "2px solid #3b82f6"
                : "2px solid var(--border)",
            borderRadius: "12px",
            padding: "16px",
            background: "var(--white)",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100px",
              background: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
              marginBottom: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Mockup of UI */}
            <div
              style={{
                height: "24px",
                background: "#020617",
                width: "30%",
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                borderRight: "1px solid #334155",
              }}
            />
            <div
              style={{
                height: "12px",
                background: "#1e293b",
                width: "70%",
                position: "absolute",
                right: 0,
                top: 0,
                borderBottom: "1px solid #334155",
              }}
            />
          </div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Dark Mode
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Easy on the eyes, featuring dark slate colors.
          </div>

          {theme === "dark" && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                color: "#3b82f6",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )}
        </div>

        {/* System Theme Option */}
        <div
          onClick={() => handleThemeChange("system")}
          style={{
            flex: 1,
            minWidth: "200px",
            cursor: "pointer",
            border:
              theme === "system" ? "2px solid #1d4ed8" : "2px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px",
            background: "var(--white)",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "16px",
              position: "relative",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* Mockup of UI (Split) */}
            <div
              style={{ flex: 1, background: "#f8fafc", position: "relative" }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#0f2545",
                  width: "60%",
                  position: "absolute",
                  left: 0,
                  top: 0,
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                background: "#0f172a",
                position: "relative",
                borderLeft: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#020617",
                  width: "60%",
                  position: "absolute",
                  left: 0,
                  top: 0,
                  borderRight: "1px solid #334155",
                }}
              />
            </div>
          </div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            System
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Automatically matches your device's preference settings.
          </div>

          {theme === "system" && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                color: "#1d4ed8",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
