// src/pages/Attendance.tsx

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ATTENDANCES } from "../graphql/attendanceQueries";
import { GET_EMPLOYEES } from "../graphql/employeeQueries";
import { GET_SETTINGS } from "../graphql/settingsQueries";
import { GET_HOLIDAYS } from "../graphql/holidayQueries";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  title: string;
  work_detail?: {
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    const d = new Date(date);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      iso,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
      dayNumber: String(d.getDate()).padStart(2, "0"),
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "A": return { bg: "#fef2f2", color: "#ef4444" }; // Red, Absent
    case "W": return { bg: "#fefceb", color: "#f59e0b" }; // Orange/White box, Weekend
    case "H": return { bg: "#fffbeb", color: "#fbbf24" }; // Yellow, Holiday
    case "L": return { bg: "#fff7ed", color: "#ea580c" }; // Orange/Yellow, Leave
    case "P": return { bg: "#f0fdf4", color: "#22c55e" }; // Green, Present
    default: return { bg: "#f8fafc", color: "#94a3b8" };  // Gray, Not Marked
  }
};

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap');

  .at-container {
    padding: 24px;
    font-family: 'DM Sans', sans-serif;
    color: #1e293b;
    background: #f8fafc;
    min-height: 100vh;
  }

  /* ── Header ── */
  .at-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }
  .at-header-title h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
  .at-header-title p { font-size: 14px; color: #64748b; margin: 4px 0 0; font-weight: 500; }
  .at-filter-btn {
    display: flex; align-items: center; gap: 8px;
    height: 38px; padding: 0 16px; border-radius: 9px;
    border: 1.5px solid #e2e8f0; background: #fff;
    font-size: 13.5px; font-weight: 600; color: #334155;
    cursor: pointer; transition: 0.2s;
  }
  .at-filter-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }

  /* ── Search & Navigation ── */
  .at-toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    background: #fff;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .at-search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
  }
  .at-search-input {
    width: 100%; height: 38px;
    padding: 0 16px 0 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-size: 13.5px;
    outline: none; background: #f8fafc;
    transition: 0.2s;
  }
  .at-search-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .at-search-icon { position: absolute; left:12px; top:11px; color:#94a3b8; pointer-events:none; }

  .at-month-picker {
    padding: 8px 12px; border-radius: 10px; border: 1px solid #cbd5e1;
    background: #fff; color: #000; font-family: inherit; font-size: 14px; outline: none;
    cursor: pointer; transition: 0.2s;
  }
  .at-month-picker:hover { border-color: #3b82f6; }

  /* ── Attendance Grid ── */
  .at-board {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }
  .at-table-container {
    max-width: 100%;
    overflow-x: auto;
    position: relative;
  }
  .at-table { border-collapse: separate; border-spacing: 0; width: 100%; }
  
  .at-th {
    padding: 12px 16px; background: #fff;
    font-size: 11px; font-weight: 700; color: #000;
    text-transform: uppercase; letter-spacing: 0.05em;
    border-bottom: 1px solid #cbd5e1; white-space: nowrap;
    position: sticky; top: 0; z-index: 10;
  }
  .at-th.at-sticky-col-2 { text-align: center; font-size: 13px; }

  .at-sticky-col-1 { position: sticky; left: 0; z-index: 20 !important; background: #fff !important; width: 280px; min-width: 280px; max-width: 280px; border-right: 1px solid #cbd5e1 !important; }
  .at-sticky-col-2 { position: sticky; left: 280px; z-index: 20 !important; background: #fff !important; width: 140px; min-width: 140px; max-width: 140px; border-right: 1px solid #cbd5e1 !important; box-shadow: 4px 0 8px -4px rgba(0,0,0,0.05); }
  
  .at-row:hover .at-sticky-col-1, .at-row:hover .at-sticky-col-2 { background: #fafbfe !important; }
  .at-row:hover { background: #fafbfe; }

  .at-td {
    padding: 12px 16px; font-size: 13.5px;
    padding: 14px 16px; font-size: 14.5px;
    border-bottom: 1px solid #cbd5e1; color: #334155;
    vertical-align: middle;
  }
  .at-td.at-sticky-col-2 { text-align: center; }

  /* ── Date Columns ── */
  .at-th-day { text-align: center; min-width: 50px; padding: 12px 4px; font-weight: 700; color: #000; }
  .at-th-day span { display: block; font-size: 11px; margin-bottom: 3px; text-transform: uppercase; }
  .at-day-num { font-size: 15px; }
  .at-th-day.is-today { color: #3b82f6; }
  .at-th-day.is-today .at-day-num { background: #eff6ff; color: #3b82f6; border-radius: 6px; }

  .at-td-status { padding: 10px 4px; text-align: center; border-right: 1px solid #cbd5e1; }
  .at-marker {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 8px; margin: 0 auto;
    font-size: 13px; font-weight: 800; cursor: default;
  }

  /* ── Meta Info ── */
  .at-emp-info { display: flex; flex-direction: column; }
  .at-emp-name { font-size: 14.5px; font-weight: 700; color: #334155; line-height: 1.2; }
  .at-emp-total { font-size: 12px; color: #94a3b8; margin-top: 2px; font-weight: 500; }
  .at-emp-id { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14.5px; color: #334155; font-variant-numeric: tabular-nums; }

  /* ── Custom Scrollbar ── */
  .at-table-container::-webkit-scrollbar { height: 8px; }
  .at-table-container::-webkit-scrollbar-track { background: #f1f5f9; }
  .at-table-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .at-table-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;

export default function Attendance() {
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState("");

  const [year, month] = useMemo(() => {
    const [y, m] = monthYear.split("-").map(Number);
    return [y, m - 1]; // month is 0-indexed in JS Date
  }, [monthYear]);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Queries
  const { data: empData, loading: empLoading } = useQuery<{ getAllEmployees: { items: Employee[] } }>(GET_EMPLOYEES);
  const { data: settingsData } = useQuery<{ settings: { working_days: string[] } }>(GET_SETTINGS);
  const { data: holData } = useQuery<{ holidays: Holiday[] }>(GET_HOLIDAYS, { variables: { year, month: month + 1 } });
  
  const fromDate = days[0].iso;
  const toDate = days[days.length - 1].iso;

  const { data: attData } = useQuery<{ attendances: { items: AttendanceRecord[] } }>(GET_ATTENDANCES, {
    variables: { from_date: fromDate, to_date: toDate }
  });

  const employees = useMemo(() => {
    let list = empData?.getAllEmployees?.items || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => 
        e.first_name.toLowerCase().includes(q) || 
        e.last_name.toLowerCase().includes(q) || 
        e.employee_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [empData, search]);

  const recordMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    attData?.attendances?.items.forEach(r => {
      if (!map[r.employee_id]) map[r.employee_id] = {};
      map[r.employee_id][r.date] = r.status.toLowerCase() === 'present' ? 'P' : 
                                   r.status.toLowerCase() === 'absent' ? 'A' : 
                                   r.status.toLowerCase() === 'half_day' ? 'L' : 'P';
    });
    return map;
  }, [attData]);

  const holidays = useMemo(() => new Set(holData?.holidays.map(h => h.date)), [holData]);
  const workingDays = useMemo(() => new Set(settingsData?.settings?.working_days || []), [settingsData]);

  const currentDayISO = new Date().toISOString().split("T")[0];

  if (empLoading) return <div className="at-container">Loading Attendance...</div>;

  return (
    <div className="at-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header Row */}
      <div className="at-header-row">
        <div className="at-header-title">
          <h1>Attendance</h1>
          <p>Welcome to your Attendance board! Here you can store and manage all of your Employee Attendance</p>
        </div>
        <button className="at-filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 21v-7M4 10V3M12 21v-11M12 6V3M20 21v-4M20 13V3M1 14h6M9 6h6M17 17h6"/></svg>
          Filter
        </button>
      </div>

      {/* Toolbar */}
      <div className="at-toolbar">
        <div className="at-search-box">
          <span className="at-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input 
            className="at-search-input" 
            placeholder="Search Employee with keywords" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <input 
          type="month" 
          className="at-month-picker" 
          value={monthYear} 
          onChange={(e) => setMonthYear(e.target.value)} 
        />
      </div>

      {/* Main Board */}
      <div className="at-board">
        <div className="at-table-container">
          <table className="at-table">
            <thead>
              <tr>
                <th className="at-th at-sticky-col-1">
                  <div className="at-emp-info">
                    <span className="at-emp-name">Employee Name</span>
                  </div>
                </th>
                <th className="at-th at-sticky-col-2">Employee ID</th>
                {days.map(day => {
                  const d = new Date(day.iso);
                  const fullName = d.toLocaleDateString("en-US", { weekday: "long" });
                  const isWeekend = !workingDays.has(fullName);
                  const isToday = day.iso === currentDayISO;
                  
                  return (
                    <th key={day.iso} className={`at-th at-th-day ${isToday ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''}`}>
                      <span>{day.dayName}</span>
                      <div className="at-day-num">{day.dayNumber}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="at-row">
                  <td className="at-td at-sticky-col-1">
                    <div className="at-emp-name">{emp.first_name} {emp.last_name}</div>
                  </td>
                  <td className="at-td at-sticky-col-2">
                    <span className="at-emp-id">{emp.employee_id}</span>
                  </td>
                  {days.map(day => {
                    const d = new Date(day.iso + "T00:00:00"); // Ensure local interpretation
                    const dayNameLong = d.toLocaleDateString("en-US", { weekday: "long" });
                    const status = holidays.has(day.iso) ? "H" : 
                                   !workingDays.has(dayNameLong) ? "W" :
                                   recordMap[emp.id]?.[day.iso] || "-";
                    
                    const marker = getStatusColor(status);

                    return (
                      <td key={day.iso} className="at-td at-td-status">
                        <div className="at-marker" style={{ background: marker.bg, color: marker.color }}>
                          {status}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={days.length + 2} style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
