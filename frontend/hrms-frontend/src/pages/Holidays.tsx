import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

/* ─────────────────────────────────────────────
   GRAPHQL
───────────────────────────────────────────── */
const GET_HOLIDAYS = gql`
  query GetHolidays($year: Int, $month: Int) {
    holidays(year: $year, month: $month) {
      id
      name
      date
      type
      description
      is_active
    }
  }
`;

const GET_SETTINGS = gql`
  query GetSettings {
    settings {
      working_days
    }
  }
`;

const CREATE_HOLIDAY = gql`
  mutation CreateHoliday($input: CreateHolidayInput!) {
    createHoliday(input: $input) { id name date }
  }
`;

const UPDATE_HOLIDAY = gql`
  mutation UpdateHoliday($id: ID!, $input: UpdateHolidayInput!) {
    updateHoliday(id: $id, input: $input) { id name date }
  }
`;

const DELETE_HOLIDAY = gql`
  mutation DeleteHoliday($id: ID!) {
    deleteHoliday(id: $id) { success message }
  }
`;

/* ─────────────────────────────────────────────
   STYLING
───────────────────────────────────────────── */
const HOLIDAY_CSS = `
  .hl-container { animation: hlFadeIn 0.4s ease-out; font-family: 'DM Sans', sans-serif; }
  @keyframes hlFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .hl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .hl-title-group { display: flex; flex-direction: column; gap: 4px; }
  .hl-title { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
  .hl-subtitle { font-size: 14px; color: var(--text-muted); }

  .hl-filters { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .hl-month-picker { 
    padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); 
    background: var(--white); color: var(--text-primary); font-family: inherit; font-size: 14px; outline: none;
  }

  /* KPI Cards */
  .hl-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
  .hl-stat-card { 
    background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 20px; 
    display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-sm); 
  }
  .hl-stat-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .hl-stat-value { font-size: 28px; font-weight: 800; color: var(--text-primary); }

  /* Calendar */
  .hl-calendar-card { background: var(--white); border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); padding: 24px; }
  .hl-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .hl-dow { font-size: 11px; font-weight: 700; color: var(--text-faint); text-align: center; padding-bottom: 12px; text-transform: uppercase; }
  
  .hl-day-cell { 
    height: 100px; border-radius: 12px; border: 1px solid var(--border); background: #f8fafc; 
    padding: 10px; display: flex; flex-direction: column; justify-content: space-between; 
    position: relative; transition: all 0.2s;
  }
  .hl-day-cell:hover { border-color: var(--accent-light); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .hl-day-cell.holiday { background: #fff1f2; border-color: #fecaca; }
  .hl-day-cell.other-month { opacity: 0.3; pointer-events: none; }
  
  .hl-day-num { font-size: 14px; font-weight: 700; color: var(--text-primary); }
  .hl-day-cell.holiday .hl-day-num { color: #e11d48; }
  
  .hl-holiday-name { font-size: 11px; font-weight: 600; color: #e11d48; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  
  .hl-update-btn { 
    width: 100%; padding: 4px; border-radius: 6px; background: rgba(15,23,42,0.05); border: none; 
    font-size: 10px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
    opacity: 0; transform: translateY(4px);
  }
  .hl-day-cell:hover .hl-update-btn { opacity: 1; transform: translateY(0); }
  .hl-update-btn:hover { background: var(--accent); color: #fff; }

  /* Table View */
  .hl-table-card { background: var(--white); border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; }
  .hl-table { width: 100%; border-collapse: collapse; }
  .hl-table th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-faint); text-transform: uppercase; border-bottom: 1px solid var(--border); background: #f8fafc; }
  .hl-table td { padding: 16px 20px; font-size: 13.5px; border-bottom: 1px solid var(--border); color: var(--text-primary); }
  .hl-table tr:last-child td { border-bottom: none; }
  .hl-type-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
  .hl-type-public { background: #ecfdf5; color: #059669; }
  .hl-type-restricted { background: #fff7ed; color: #d97706; }
  .hl-type-other { background: #f1f5f9; color: var(--text-muted); }

  .hl-view-toggle { display: flex; background: #eee; padding: 4px; border-radius: 10px; gap: 4px; }
  .hl-toggle-btn { padding: 6px 14px; border-radius: 7px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: var(--text-muted); }
  .hl-toggle-btn.active { background: #fff; color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

  /* Modal */
  .hl-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .hl-modal { background: var(--white); width: 400px; border-radius: 20px; padding: 24px; box-shadow: var(--shadow-lg); }
  .hl-modal-header { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }
  .hl-form-group { margin-bottom: 16px; }
  .hl-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
  .hl-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); font-size: 14px; outline: none; }
  .hl-modal-footer { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
  
  .hl-btn-cancel { background: #f1f5f9; color: var(--text-muted); border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .hl-btn-save { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; }
  .hl-btn-delete { background: #fff1f2; color: #e11d48; border: none; padding: 10px 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
`;

export default function Holidays() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", type: "public", description: "" });

  const [yearNum, monthNum] = monthYear.split("-").map(Number);

  const { data, refetch } = useQuery<{ holidays: any[] }>(GET_HOLIDAYS, {
    variables: { year: yearNum, month: monthNum },
    fetchPolicy: "network-only"
  });

  const { data: settingsData } = useQuery<{ settings: any }>(GET_SETTINGS);

  const [createHoliday] = useMutation(CREATE_HOLIDAY);
  const [updateHoliday] = useMutation(UPDATE_HOLIDAY);
  const [deleteHoliday] = useMutation(DELETE_HOLIDAY);

  const holidaysList = data?.holidays || [];
  const workingDaysConfig = settingsData?.settings?.working_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* ─────────────────────────────────────────────
     CALENDAR HELPERS
  ───────────────────────────────────────────── */
  const daysInMonth = useMemo(() => {
    const date = new Date(yearNum, monthNum - 1, 1);
    const days = [];
    const firstDay = date.getDay(); // 0-6
    
    // Previous month padding
    const prevMonthLastDay = new Date(yearNum, monthNum - 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false });
    }
    
    // Current month days
    const totalDays = new Date(yearNum, monthNum, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    
    return days;
  }, [yearNum, monthNum]);

  const kpis = useMemo(() => {
    const total = new Date(yearNum, monthNum, 0).getDate();
    let working = 0;
    const holidayCount = holidaysList.length;

    for (let i = 1; i <= total; i++) {
      const d = new Date(yearNum, monthNum - 1, i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const isWeekend = !workingDaysConfig.includes(dayName);
      const isHoliday = holidaysList.some((h: any) => new Date(h.date).getDate() === i);

      if (!isWeekend && !isHoliday) {
        working++;
      }
    }

    return { total, working, holidayCount };
  }, [yearNum, monthNum, holidaysList, workingDaysConfig]);

  /* ─────────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────────── */
  const handleOpenUpdate = (day: number) => {
    const existing = holidaysList.find((h: any) => new Date(h.date).getDate() === day);
    setSelectedDay({ day, id: existing?.id });
    setFormData({
      name: existing?.name || "",
      type: existing?.type || "public",
      description: existing?.description || ""
    });
  };

  const handleSave = async () => {
    try {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}`;
      if (selectedDay.id) {
        await updateHoliday({ variables: { id: selectedDay.id, input: formData } });
      } else {
        await createHoliday({ variables: { input: { ...formData, date: dateStr } } });
      }
      refetch();
      setSelectedDay(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this holiday?")) return;
    try {
      await deleteHoliday({ variables: { id: selectedDay.id } });
      refetch();
      setSelectedDay(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="hl-container">
      <style dangerouslySetInnerHTML={{ __html: HOLIDAY_CSS }} />
      
      <div className="hl-header">
        <div className="hl-title-group">
          <h1 className="hl-title">Holidays</h1>
          <p className="hl-subtitle">Manage institutional holidays and academic breaks</p>
        </div>
        
        <div className="hl-filters">
          <div className="hl-view-toggle">
            <button 
              className={`hl-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
            <button 
              className={`hl-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <input 
            type="month" 
            className="hl-month-picker" 
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)} 
          />
        </div>
      </div>

      <div className="hl-stats-grid">
        <div className="hl-stat-card">
          <span className="hl-stat-label">Total Days</span>
          <span className="hl-stat-value">{kpis.total}</span>
        </div>
        <div className="hl-stat-card" style={{ borderColor: 'var(--accent-light)' }}>
          <span className="hl-stat-label">Working Days</span>
          <span className="hl-stat-value" style={{ color: 'var(--accent)' }}>{kpis.working}</span>
        </div>
        <div className="hl-stat-card" style={{ borderColor: '#fca5a5' }}>
          <span className="hl-stat-label">Holidays</span>
          <span className="hl-stat-value" style={{ color: '#e11d48' }}>{kpis.holidayCount}</span>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="hl-calendar-card">
          <div className="hl-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="hl-dow">{d}</div>
            ))}
            
            {daysInMonth.map((d, index) => {
              const h = d.currentMonth ? holidaysList.find((hl: any) => new Date(hl.date).getDate() === d.day) : null;
              return (
                <div 
                  key={index} 
                  className={`hl-day-cell ${!d.currentMonth ? 'other-month' : ''} ${h ? 'holiday' : ''}`}
                >
                  <div className="hl-day-num">{d.day}</div>
                  {h && <div className="hl-holiday-name">{h.name}</div>}
                  {d.currentMonth && (
                    <button className="hl-update-btn" onClick={() => handleOpenUpdate(d.day)}>
                      UPDATE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hl-table-card">
          <table className="hl-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Holiday Name</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {holidaysList.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>
                    No holidays found for this month
                  </td>
                </tr>
              ) : (
                holidaysList.map((h: any) => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{new Date(h.date).toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ fontWeight: 700 }}>{h.name}</td>
                    <td>
                      <span className={`hl-type-badge hl-type-${h.type}`}>
                        {h.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                         className="hl-btn-cancel" 
                         style={{ padding: '6px 12px', fontSize: '11px' }}
                         onClick={() => handleOpenUpdate(new Date(h.date).getDate())}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDay && (
        <div className="hl-modal-overlay">
          <div className="hl-modal anim-up">
            <div className="hl-modal-header">
              {selectedDay.id ? "Update" : "Add"} Holiday for Day {selectedDay.day}
            </div>
            
            <div className="hl-form-group">
              <label className="hl-label">Holiday Name</label>
              <input 
                className="hl-input" 
                placeholder="e.g. Independence Day" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="hl-form-group">
              <label className="hl-label">Type</label>
              <select 
                className="hl-input"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="hl-form-group">
              <label className="hl-label">Description (Optional)</label>
              <textarea 
                className="hl-input" 
                rows={3} 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="hl-modal-footer">
              {selectedDay.id && (
                <button className="hl-btn-delete" onClick={handleDelete} title="Delete Holiday">
                   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button className="hl-btn-cancel" onClick={() => setSelectedDay(null)}>Cancel</button>
              <button className="hl-btn-save" onClick={handleSave}>Save Holiday</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
