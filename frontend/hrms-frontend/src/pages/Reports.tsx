import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_HR_ANALYTICS } from "../graphql/reportQueries";

const CSS = `
  .rp-container { padding: 32px; background: #f0f4f8; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
  .rp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .rp-title { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
  .rp-date { color: #64748b; font-size: 14px; font-weight: 500; }
  
  .rp-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 40px; }
  .rp-stat-card { 
    background: #fff; border-radius: 20px; padding: 24px; border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .rp-stat-card:hover { transform: translateY(-4px); }
  .rp-stat-label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .rp-stat-value { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  .rp-stat-sub { font-size: 13px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px; }

  .rp-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
  .rp-section { 
    background: #fff; border-radius: 24px; padding: 32px; border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }
  .rp-sec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .rp-sec-title { font-size: 18px; font-weight: 700; color: #0f172a; }
  
  .rp-chart-container { height: 300px; position: relative; }
  
  /* Horizontal Bar Chart */
  .rp-hbar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
  .rp-hbar-label { width: 120px; font-size: 13px; font-weight: 600; color: #334155; }
  .rp-hbar-track { flex: 1; height: 10px; background: #f1f5f9; border-radius: 99px; overflow: hidden; position: relative; }
  .rp-hbar-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
  .rp-hbar-val { width: 40px; font-size: 13px; font-weight: 700; color: #1e293b; text-align: right; }

  /* Donut Chart placeholder */
  .rp-donut-box { display: flex; justify-content: center; align-items: center; height: 220px; position: relative; }
  .rp-donut-svg { transform: rotate(-90deg); width: 180px; height: 180px; }
  .rp-donut-ring { fill: none; stroke-width: 20; stroke-linecap: round; }
  .rp-donut-center { 
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
    text-align: center; 
  }
  .rp-donut-total { font-size: 24px; font-weight: 800; color: #1e293b; }
  .rp-donut-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }

  .rp-legend { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; }
  .rp-leg-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #475569; }
  .rp-leg-dot { width: 10px; height: 10px; border-radius: 50%; }

  @keyframes rp-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .rp-ani { animation: rp-fade-in 0.4s ease-out forwards; }
`;

interface StatItem { label: string; count: number; color?: string; }

interface HrAnalyticsData {
  hrAnalytics: {
    employeeStats: {
      total: number;
      active: number;
      onLeave: number;
      genderBreakdown: StatItem[];
      deptBreakdown: StatItem[];
    };
    attendanceStats: {
      todayPresent: number;
      todayAbsent: number;
      weeklyTrend: StatItem[];
    };
    leaveStats: {
      pending: number;
      approved: number;
      rejected: number;
      typeBreakdown: StatItem[];
    };
  };
}

const Reports: React.FC = () => {
  const { data, loading, error } = useQuery<HrAnalyticsData>(GET_HR_ANALYTICS);
  // const [activeView, setActiveView] = useState("overview");

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Generating premium insights...</div>;
  if (error || !data) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error?.message || "No data"}</div>;

  const { hrAnalytics } = data;
  const { employeeStats, attendanceStats, leaveStats } = hrAnalytics;

  // Colors
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const employeeStatsData = employeeStats.deptBreakdown.map((d: StatItem, i: number) => ({
    ...d, color: palette[i % palette.length]
  }));

  const leaveDistribution = leaveStats.typeBreakdown.map((l: StatItem, i: number) => ({
    ...l, color: palette[i % palette.length]
  }));

  const totalLeaves = leaveStats.pending + leaveStats.approved + leaveStats.rejected;
  
  interface DonutItem extends StatItem { strokeDash: number; offset: number; color: string; }
  
  // Donut logic
  const donutItems = employeeStats.genderBreakdown.reduce((acc: DonutItem[], g: StatItem, i: number) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].strokeDash : 0;
    const percent = (g.count / employeeStats.total) || 0;
    const strokeDash = percent * 502; 
    acc.push({ 
      ...g, 
      strokeDash, 
      offset: prevOffset, 
      color: i === 0 ? "#6366f1" : i === 1 ? "#ec4899" : "#94a3b8" 
    });
    return acc;
  }, []);

  return (
    <div className="rp-container">
      <style>{CSS}</style>
      
      <div className="rp-header rp-ani">
        <div>
          <h1 className="rp-title">HR Analytics & Reports</h1>
          <p className="rp-date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <button 
          className="ed-btn ed-btn-primary" 
          onClick={() => window.print()}
          style={{ height: '42px', padding: '0 24px', borderRadius: '12px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}>
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Export Summary
        </button>
      </div>

      <div className="rp-stats-grid rp-ani">
        <div className="rp-stat-card">
          <div className="rp-stat-label">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Total Employees
          </div>
          <div className="rp-stat-value">{employeeStats.total}</div>
          <div className="rp-stat-sub">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            {employeeStats.active} Active
          </div>
        </div>
        
        <div className="rp-stat-card">
          <div className="rp-stat-label">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Today's Attendance
          </div>
          <div className="rp-stat-value">{((attendanceStats.todayPresent / employeeStats.total) * 100 || 0).toFixed(1)}%</div>
          <div className="rp-stat-sub" style={{ color: '#6366f1' }}>
            {attendanceStats.todayPresent} Present Today
          </div>
        </div>

        <div className="rp-stat-card">
          <div className="rp-stat-label">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Leaves Pending
          </div>
          <div className="rp-stat-value" style={{ color: '#f59e0b' }}>{leaveStats.pending}</div>
          <div className="rp-stat-sub" style={{ color: '#f59e0b' }}>Requires Review</div>
        </div>
      </div>

      <div className="rp-main-grid rp-ani">
        <div className="rp-section">
          <div className="rp-sec-head">
            <h2 className="rp-sec-title">Employee Distribution by Department</h2>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Active Staff Only</div>
          </div>
          <div className="rp-chart-container">
            {employeeStatsData.map((d: StatItem & { color: string }) => {
              const p = (d.count / employeeStats.total) * 100;
              return (
                <div key={d.label} className="rp-hbar-row">
                  <div className="rp-hbar-label">{d.label}</div>
                  <div className="rp-hbar-track">
                    <div className="rp-hbar-fill" style={{ width: `${p}%`, background: d.color }}></div>
                  </div>
                  <div className="rp-hbar-val">{d.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rp-section">
          <div className="rp-sec-head">
            <h2 className="rp-sec-title">Gender Balance</h2>
          </div>
          <div className="rp-donut-box">
            <svg className="rp-donut-svg">
              <circle cx="90" cy="90" r="80" className="rp-donut-ring" style={{ stroke: '#f1f5f9' }} />
              {donutItems.map((d: StatItem & { strokeDash: number, offset: number, color: string }) => (
                <circle 
                  key={d.label}
                  cx="90" cy="90" r="80" 
                  className="rp-donut-ring" 
                  style={{ 
                    stroke: d.color, 
                    strokeDasharray: `${d.strokeDash} 502`, 
                    strokeDashoffset: -d.offset 
                  }} 
                />
              ))}
            </svg>
            <div className="rp-donut-center">
              <div className="rp-donut-total">{employeeStats.total}</div>
              <div className="rp-donut-lbl">Total</div>
            </div>
          </div>
          <div className="rp-legend">
            {donutItems.map((d: StatItem & { color: string }) => (
              <div key={d.label} className="rp-leg-item">
                <div className="rp-leg-dot" style={{ background: d.color }} />
                <span>{d.label}: {d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-section" style={{ gridColumn: 'span 2' }}>
          <div className="rp-sec-head">
            <h2 className="rp-sec-title">Leave Type Utilization</h2>
            <div className="rp-stat-sub" style={{ color: '#64748b' }}>Total across all categories</div>
          </div>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {leaveDistribution.map((l: StatItem & { color: string }) => {
                const p = (l.count / totalLeaves) * 100 || 0;
                return (
                  <div key={l.label} className="rp-hbar-row">
                    <div className="rp-hbar-label" style={{ width: '160px' }}>{l.label}</div>
                    <div className="rp-hbar-track">
                      <div className="rp-hbar-fill" style={{ width: `${p}%`, background: l.color }}></div>
                    </div>
                    <div className="rp-hbar-val">{l.count}</div>
                  </div>
                );
              })}
            </div>
            <div className="ed-section" style={{ width: '280px', margin: 0, background: '#f8fafc' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '16px' }}>Status Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="rp-stat-sub" style={{ color: '#f59e0b', justifyContent: 'space-between' }}>
                  <span>Pending Review</span>
                  <span style={{ fontWeight: 800 }}>{leaveStats.pending}</span>
                </div>
                <div className="rp-stat-sub" style={{ color: '#10b981', justifyContent: 'space-between' }}>
                  <span>Approved Leaves</span>
                  <span style={{ fontWeight: 800 }}>{leaveStats.approved}</span>
                </div>
                <div className="rp-stat-sub" style={{ color: '#ef4444', justifyContent: 'space-between' }}>
                  <span>Rejected Actions</span>
                  <span style={{ fontWeight: 800 }}>{leaveStats.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
