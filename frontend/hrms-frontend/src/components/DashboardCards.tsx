// src/components/DashboardCard.tsx
// ─────────────────────────────────────────────
// Reusable stat card for the Dashboard overview
// ─────────────────────────────────────────────

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  trend: string;
  trendUp: boolean;
}

// ── Inline SVG icons keyed by name ────────────
function CardIcon({ name, color }: { name: string; color: string }) {
  const props = {
    width: 20,
    height: 20,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: color,
    strokeWidth: 1.9,
  } as const;

  switch (name) {
    case "people":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87
               m6-4.13a4 4 0 11-8 0 4 4 0 018 0z
               m6-4a4 4 0 11-6.32-3.26" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "x-circle":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2
               m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7
               a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "building":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16
               m14 0h2m-2 0h-5m-9 0H3m2 0h5
               M9 7h1m-1 4h1m4-4h1m-1 4h1
               m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Trend arrow ────────────────────────────────
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      width="12" height="12" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2.5}
    >
      {up ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      )}
    </svg>
  );
}

// ── Component ─────────────────────────────────
interface DashboardCardProps {
  card: StatCard;
  style?: React.CSSProperties;
}

export default function DashboardCard({ card, style }: DashboardCardProps) {
  return (
    <div className="dc-card" style={style}>
      <div className="dc-top">
        <div className="dc-icon-box" style={{ background: card.bgColor }}>
          <CardIcon name={card.icon} color={card.color} />
        </div>
        <span className="dc-label">{card.label}</span>
      </div>

      {/* Number uses Inter for clean, uniform digit rendering */}
      <div
        className="dc-value"
        style={{
          color: card.color,
          fontFamily: "'Inter', 'DM Mono', monospace",
          fontWeight: 700,
          fontSize: "36px",
          letterSpacing: "-1px",
          lineHeight: 1,
          marginBottom: "8px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {card.value}
      </div>

      <div
        className="dc-trend"
        style={{ color: card.trendUp ? "#059669" : "#d97706" }}
      >
        <TrendArrow up={card.trendUp} />
        <span>{card.trend}</span>
      </div>

      {/* Bottom accent line */}
      <div className="dc-accent" style={{ background: card.color }} />
    </div>
  );
}
