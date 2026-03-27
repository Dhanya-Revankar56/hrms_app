// src/pages/dashboard.tsx
import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS, GET_SETTINGS } from "../graphql/settingsQueries";
import { GET_EMPLOYEES } from "../graphql/employeeQueries";
import DashboardCard from "../components/DashboardCards";

const DASHBOARD_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .dash-heading { font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; line-height: 1.2; }
  .dash-subheading { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; color: #64748b; margin-top: 3px; }
  .dash-section-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(15,23,42,.06); overflow: hidden; }
  .dash-section-header { padding: 14px 18px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .dash-section-title { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 700; color: #0f172a; }
  .dash-section-body { padding: 0 18px; }
  .dash-row-item { display: flex; align-items: center; gap: 11px; padding: 10px 0; border-bottom: 1px solid #f8fafc; }
  .dash-row-item:last-child { border-bottom: none; }
  .dash-row-text { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; color: #0f172a; line-height: 1.3; }
  .dash-row-sub { font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 400; color: #94a3b8; margin-top: 2px; }
  .dash-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; color: #fff; flex-shrink: 0; }

  .pending-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(15,23,42,.06); overflow: hidden; }
  .pending-card-header { padding: 14px 18px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .pending-icon-box { width: 38px; height: 38px; border-radius: 9px; background: #fff7ed; display: flex; align-items: center; justify-content: center; }
  .pending-badge { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; color: #9a3412; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 99px; padding: 2px 9px; }
  .pending-number { font-family: 'Inter', monospace; font-size: 36px; font-weight: 700; color: #0f172a; padding: 14px 18px 4px; }
  .pending-number-label { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #64748b; padding: 0 18px 14px; }
  .pending-breakdown { padding: 0 18px; border-top: 1px solid #f1f5f9; }
  .pending-breakdown-item { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f8fafc; }
  .pending-breakdown-item:last-child { border-bottom: none; }
  .pending-breakdown-label { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #334155; display: flex; align-items: center; gap: 8px; }
  .pending-breakdown-icon { width: 26px; height: 26px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
  .pending-breakdown-count { font-family: 'Inter', monospace; font-size: 12.5px; font-weight: 700; color: #0f2545; background: #f1f5f9; border-radius: 6px; padding: 2px 9px; }

  .on-leave-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(15,23,42,.06); overflow: hidden; }
  .on-leave-header { padding: 14px 18px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
  .on-leave-title { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 7px; }
  .on-leave-count-pill { font-family: 'Inter', monospace; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; border-radius: 99px; padding: 2px 8px; }
  .on-leave-body { padding: 0 18px; }
  .on-leave-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f8fafc; }
  .on-leave-row:last-child { border-bottom: none; }
  .on-leave-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
  .on-leave-name { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #0f172a; line-height: 1.2; }
  .on-leave-dept { font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 400; color: #94a3b8; margin-top: 1px; }

  .holiday-type-badge { display: inline-block; padding: 1px 7px; border-radius: 99px; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .holiday-type-public { background: #fef2f2; color: #dc2626; }
  .holiday-type-restricted { background: #fffbeb; color: #b45309; }
  .holiday-type-other { background: #f1f5f9; color: #475569; }
`;

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase();

const getColor = (name: string) => {
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatHolidayDate = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const getDaysUntil = (isoStr: string) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(isoStr); d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
};

export default function Dashboard() {
  const { data: statsData } = useQuery<any>(GET_DASHBOARD_STATS, { fetchPolicy: "network-only" });
  const { data: employeesData } = useQuery<any>(GET_EMPLOYEES, { fetchPolicy: "network-only" });
  const { data: settingsData } = useQuery<any>(GET_SETTINGS, { fetchPolicy: "network-only" });

  const stats = statsData?.dashboardStats || {
    totalEmployees: 0, onLeaveToday: 0, presentToday: 0,
    absentToday: 0, pendingApprovals: 0, pendingLeaves: 0,
    pendingMovements: 0, upcomingHolidays: [], onLeaveEmployees: []
  };
  const departmentsCount = settingsData?.settings?.departments?.length || 0;
  const upcomingHolidays: any[] = stats.upcomingHolidays || [];

  const statCards = [
    { id: "total",       label: "Total Employees", value: stats.totalEmployees,  icon: "people",      color: "#1d4ed8", bgColor: "#eff6ff", trend: "Real-time",         trendUp: true  },
    { id: "present",     label: "Present Today",   value: stats.presentToday,    icon: "check-circle",color: "#059669", bgColor: "#f0fdf4", trend: "From attendance",   trendUp: true  },
    { id: "absent",      label: "Absent Today",    value: stats.absentToday,     icon: "x-circle",    color: "#dc2626", bgColor: "#fef2f2", trend: "Unmarked",          trendUp: false },
    { id: "leave",       label: "On Leave Today",  value: stats.onLeaveToday,    icon: "calendar",    color: "#d97706", bgColor: "#fffbeb", trend: `${stats.pendingApprovals} pending`, trendUp: false },
    { id: "departments", label: "Departments",     value: departmentsCount,      icon: "building",    color: "#7c3aed", bgColor: "#f5f3ff", trend: "All active",        trendUp: true  },
  ];

  const recentEmployees = (employeesData?.getAllEmployees?.items || []).slice(0, 5).map((emp: any) => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    role: emp.work_detail?.designation?.name || "Employee",
    dept: emp.work_detail?.department?.name || "Unassigned",
    avatarInitials: getInitials(`${emp.first_name} ${emp.last_name}`),
    avatarColor: getColor(`${emp.first_name} ${emp.last_name}`),
  }));

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <div>
        {/* Header */}
        <div style={{ marginBottom: "22px" }}>
          <h1 className="dash-heading">Welcome to CampusHR 👋</h1>
          <p className="dash-subheading">Here&apos;s what&apos;s happening today · {today}</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "20px" }}>
          {statCards.map((card) => <DashboardCard key={card.id} card={card} />)}
        </div>

        {/* Mid Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "20px" }}>
          {/* Pending Approvals */}
          <div className="pending-card">
            <div className="pending-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="pending-icon-box">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ea580c" strokeWidth={1.9}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="dash-section-title">Pending Approvals</span>
              </div>
              <span className="pending-badge">Needs Action</span>
            </div>
            <div className="pending-number">{stats.pendingApprovals}</div>
            <div className="pending-number-label">employees awaiting approval</div>
            <div className="pending-breakdown">
              <div className="pending-breakdown-item">
                <span className="pending-breakdown-label">
                  <span className="pending-breakdown-icon">📋</span>Pending Leave
                </span>
                <span className="pending-breakdown-count">{stats.pendingLeaves || 0}</span>
              </div>
              <div className="pending-breakdown-item">
                <span className="pending-breakdown-label">
                  <span className="pending-breakdown-icon">🚗</span>Pending Movement
                </span>
                <span className="pending-breakdown-count">{stats.pendingMovements || 0}</span>
              </div>
            </div>
          </div>

          {/* On Leave Today */}
          <div className="on-leave-card">
            <div className="on-leave-header">
              <span className="on-leave-title">
                On Leave Today <span className="on-leave-count-pill">{stats.onLeaveToday}</span>
              </span>
            </div>
            <div className="on-leave-body">
              {stats.onLeaveToday === 0 ? (
                <div className="dash-row-sub" style={{ padding: "20px 0" }}>Everyone is present today!</div>
              ) : (
                (stats.onLeaveEmployees || []).map((emp: any) => (
                  <div key={emp.id} className="on-leave-row">
                    <div className="on-leave-avatar" style={{ background: getColor(emp.name) }}>
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <div className="on-leave-name">{emp.name}</div>
                      <div className="on-leave-dept">{emp.department} · {emp.leave_type}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Birthdays */}
          <div className="dash-section-card">
            <div className="dash-section-header"><span className="dash-section-title">🎂 Birthdays</span></div>
            <div className="dash-section-body">
              <div className="dash-row-sub" style={{ padding: "20px 0" }}>No birthdays today.</div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {/* Recent Joinees */}
          <div className="dash-section-card">
            <div className="dash-section-header"><span className="dash-section-title">Recent Joinees</span></div>
            <div className="dash-section-body">
              {recentEmployees.length === 0 ? (
                <div className="dash-row-sub" style={{ padding: "20px 0" }}>No recent joinees.</div>
              ) : (
                recentEmployees.map((emp: any) => (
                  <div key={emp.id} className="dash-row-item">
                    <div className="dash-avatar" style={{ background: emp.avatarColor }}>{emp.avatarInitials}</div>
                    <div>
                      <div className="dash-row-text">{emp.name}</div>
                      <div className="dash-row-sub">{emp.role} · {emp.dept}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="dash-section-card">
            <div className="dash-section-header"><span className="dash-section-title">📢 Announcements</span></div>
            <div className="dash-section-body">
              <div className="dash-row-item">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✉️</div>
                <div>
                  <div className="dash-row-text">Annual Townhall</div>
                  <div className="dash-row-sub">Scheduled for 25th March 2026</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Holidays — LIVE from DB */}
          <div className="dash-section-card">
            <div className="dash-section-header">
              <span className="dash-section-title">🗓️ Upcoming Holidays</span>
              {upcomingHolidays.length > 0 && (
                <span style={{ fontFamily: "'Inter', monospace", fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626", borderRadius: 99, padding: "2px 8px" }}>
                  {upcomingHolidays.length} ahead
                </span>
              )}
            </div>
            <div className="dash-section-body">
              {upcomingHolidays.length === 0 ? (
                <div className="dash-row-sub" style={{ padding: "20px 0" }}>No upcoming holidays scheduled.</div>
              ) : (
                upcomingHolidays.map((h: any) => (
                  <div key={h.id} className="dash-row-item">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🚩</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dash-row-text" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                        <span className={`holiday-type-badge holiday-type-${h.type || "public"}`}>{h.type || "public"}</span>
                      </div>
                      <div className="dash-row-sub" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{formatHolidayDate(h.date)}</span>
                        <span style={{ color: "#1d4ed8", fontWeight: 600 }}>{getDaysUntil(h.date)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
