import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_EVENT_LOGS } from "../graphql/eventLogQueries";

/* ─────────────────────────────────────────────
   STYLING
   Using CSS-in-JS for isolation and premium look 
───────────────────────────────────────────── */
const CSS = `
  .er-container { animation: erFadeIn 0.5s ease-out; color: #1e293b; }
  @keyframes erFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .er-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .er-title-group { display: flex; flex-direction: column; gap: 4px; }
  .er-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.3px; font-family: 'DM Sans', sans-serif; }
  .er-subtitle { font-size: 13.5px; color: #6b7280; margin: 0; font-family: 'DM Sans', sans-serif; }

  /* ── Filter Bar (Matches Movement Register Sync) ── */
  .er-filter-bar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; background: #fff; }
  .er-search-wrap { position: relative; flex: 0 0 180px; }
  .er-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .er-search { width: 100%; height: 36px; padding: 0 12px 0 34px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #0f172a; background: #fafafa; outline: none; transition: 0.14s; }
  .er-search:focus { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 3px rgba(79,70,229,.09); }

  .er-filter-sel {
    height: 36px; padding: 0 26px 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #334155;
    background: #fafafa; outline: none; cursor: pointer; flex-shrink: 0; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 9px center; transition: 0.14s;
  }
  .er-filter-sel:focus { border-color: #4f46e5; background: #fff; }
  .er-filter-date { height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; color: #334155; background: #fafafa; outline: none; }
  .er-filter-date:focus { border-color: #4f46e5; background: #fff; }
  
  .er-filter-divider { width: 1px; height: 20px; background: #e2e8f0; flex-shrink: 0; margin: 0 4px; }
  .er-filter-count { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #64748b; white-space: nowrap; margin-left: auto; }

  /* ── Table (Matches Movement Register Sync) ── */
  .er-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .er-table { width: 100%; border-collapse: collapse; }
  .er-table th { background: #f8fafc; padding: 14px 20px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; text-transform: none; border-bottom: 1px solid #e2e8f0; font-family: 'DM Sans', sans-serif; }
  .er-table td { padding: 18px 20px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-family: 'DM Sans', sans-serif; }
  .er-row-in { animation: erRowIn 0.4s ease-out backwards; }
  @keyframes erRowIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }

  /* Action badge - pill with dot (Compact) */
  .er-badge-action {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px !important;
    font-size: 11px; font-weight: 700; white-space: nowrap;
    letter-spacing: .02em; font-family: 'DM Sans', sans-serif;
    text-transform: uppercase; border: none;
  }
  .er-badge-action::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

  /* Module badge - original design (Pill without dot) */
  .er-badge-module {
    display: inline-block; padding: 4px 12px; border-radius: 8px;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe;
  }

  /* Color Palette - Standardized Event Types */
  .er-action-joined, .er-action-created { background: #dcfce7 !important; color: #166534 !important; }
  .er-action-updated { background: #dbeafe !important; color: #1e40af !important; }
  .er-action-deleted { background: #fee2e2 !important; color: #991b1b !important; }
  .er-action-relieved { background: #f3e8ff !important; color: #7e22ce !important; }
  
  .er-badge-module { background: #f1f5f9 !important; color: #475569 !important; border: 1px solid #e2e8f0 !important; }
  .er-badge-module-employee { background: #eff6ff !important; color: #1d4ed8 !important; }
  .er-badge-module-leave, .er-badge-module-movement { background: #fff7ed !important; color: #9a3412 !important; }

  .er-btn-view { background: #fff; color: #4f46e5; border: 1.5px solid #e0e7ff; padding: 6px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .er-btn-view:hover { background: #4f46e5; color: #fff; border-color: #4f46e5; box-shadow: 0 4px 10px rgba(79,70,229,0.25); }

  /* Details View (Full Content) */
  .er-details-view { background: #fff; padding: 32px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05); animation: erFadeIn 0.3s ease-out; }
  .er-details-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
  .er-back-btn { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #64748b; background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
  .er-back-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
  
  .er-details-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; font-family: 'DM Sans', sans-serif; }
  .er-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 40px; }
  .er-meta-item { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
  .er-meta-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block; font-family: 'DM Sans', sans-serif; }
  .er-meta-value { font-size: 13.5px; font-weight: 700; color: #1e293b; font-family: 'DM Sans', sans-serif; }

  .er-section-title { font-size: 10.5px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-family: 'DM Sans', sans-serif; }
  .er-section-title::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

  /* Structured Changes Table */
  .er-changes-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .er-changes-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .er-changes-table td { padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .er-changes-table tr:last-child td { border-bottom: none; }
  
  .er-val-box { padding: 8px 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; min-height: 20px; font-family: 'DM Sans', sans-serif; margin-bottom: 6px; overflow-wrap: break-word; font-size: 13px; }
  .er-val-old { color: #64748b; font-weight: 500; font-style: italic; }
  .er-val-new { color: #0f172a; font-weight: 600; }
  .er-val-added { background: #f0fdf4; border-color: #dcfce7; }
  .er-val-removed { background: #fef2f2; border-color: #fee2e2; }
  .er-val-changed { background: #fff7ed; border-color: #ffedd5; }
  
  .er-diff-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px auto 0; max-width: 900px; }
  .er-diff-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .er-diff-header { font-size: 12px; font-weight: 800; color: #64748b; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  
  .er-diff-key { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; display: block; font-family: 'DM Sans', sans-serif; }
  .er-timestamp { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #334155; }
  .er-timestamp-sub { font-size: 11.5px; color: #94a3b8; font-weight: 500; margin-top: 1px; font-family: 'DM Sans', sans-serif; }
`;

/* ─────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────── */
interface EventLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  action_type: "JOINED" | "UPDATED" | "CREATED" | "DELETED" | "RELIEVED";
  module_name: "employee" | "onboarding" | "leave" | "attendance" | "movement" | "relieving" | "settings" | "holidays";
  record_id?: string;
  description?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string;
  timestamp: string;
}

interface EventLogResponse {
  eventLogs: {
    items: EventLog[];
    pageInfo: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
    };
  };
}

const MODULES = ["employee", "onboarding", "leave", "attendance", "movement", "relieving", "settings", "holidays"];
const ACTIONS = ["JOINED", "UPDATED", "CREATED", "DELETED", "RELIEVED"];

interface DiffResult {
  key: string;
  oldVal: string;
  newVal: string;
  isChanged: boolean;
  isAdded?: boolean;
  isRemoved?: boolean;
}

export default function EventRegister() {
  const [filters, setFilters] = useState({
    module_name: "",
    action_type: "",
    date_from: "",
    date_to: "",
  });
  
  const [selectedLog, setSelectedLog] = useState<EventLog | null>(null);

  const { data, loading, error } = useQuery<EventLogResponse>(GET_EVENT_LOGS, {
    variables: {
      ...filters,
      pagination: { page: 1, limit: 100 }
    },
    fetchPolicy: "network-only"
  });

  const logs: EventLog[] = data?.eventLogs?.items || [];

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatTimestamp = (ts: string | number | Date | null | undefined) => {
    if (!ts) return { date: "—", time: "" };
    
    // Attempt parse (handles numeric strings and standard dates)
    const d = isNaN(Number(ts)) ? new Date(ts) : new Date(Number(ts));
    
    if (isNaN(d.getTime())) return { date: "Invalid Date", time: "" };

    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    
    const formattedTime = d.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });

    return {
      date: formattedDate,
      time: formattedTime
    };
  };

  const formatAction = (action: string) => {
    if (!action) return "UNKNOWN";
    if (action === "JOINED") return "Joined";
    if (action === "RELIEVED") return "Relieved";
    if (action === "CREATED") return "Created";
    if (action === "DELETED") return "Deleted";
    if (action === "UPDATED") return "Updated";
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  /* ─────────────────────────────────────────────
     DIFF LOGIC
  ───────────────────────────────────────────── */
  const getDiff = (log: EventLog): DiffResult[] => {
    if (log.changes) {
      return Object.entries(log.changes).map(([key, val]) => ({
        key,
        oldVal: val.old === null || val.old === undefined ? "—" : (typeof val.old === 'object' ? JSON.stringify(val.old) : String(val.old)),
        newVal: val.new === null || val.new === undefined ? "—" : (typeof val.new === 'object' ? JSON.stringify(val.new) : String(val.new)),
        isChanged: true,
        isAdded: (val.old === null || val.old === undefined) && (val.new !== null && val.new !== undefined),
        isRemoved: (val.old !== null && val.old !== undefined) && (val.new === null || val.new === undefined)
      }));
    }

    if (!log.old_data && !log.new_data) return [];
    
    const diff: DiffResult[] = [];
    const allKeys = Array.from(new Set([...Object.keys(log.old_data || {}), ...Object.keys(log.new_data || {})]));

    for (const key of allKeys) {
      if (['_id', 'id', 'updated_at', 'created_at', '__v', 'timestamp'].includes(key)) continue;
      const oldVal = log.old_data?.[key];
      const newVal = log.new_data?.[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff.push({
          key,
          oldVal: oldVal === undefined ? "—" : (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)),
          newVal: newVal === undefined ? "—" : (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)),
          isChanged: true,
          isAdded: oldVal === undefined && newVal !== undefined,
          isRemoved: oldVal !== undefined && newVal === undefined
        });
      }
    }
    return diff;
  };

  if (selectedLog) {
    const diffs = getDiff(selectedLog);
    const ts = formatTimestamp(selectedLog.timestamp);

    return (
      <div className="er-container">
        <style>{CSS}</style>
        
        <div className="er-details-view">
          <div className="er-details-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button className="er-back-btn" onClick={() => setSelectedLog(null)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Register
              </button>
              <h2 className="er-details-title">Event Record Details</h2>
            </div>
          </div>

          <div className="er-meta-grid">
            <div className="er-meta-item" style={{ borderRadius: '16px' }}>
              <span className="er-meta-label">Module Name</span>
              <div className="er-meta-value" style={{ textTransform: 'capitalize' }}>{selectedLog.module_name}</div>
            </div>
            <div className="er-meta-item" style={{ borderRadius: '16px' }}>
              <span className="er-meta-label">Action Taken</span>
              <div className="er-meta-value">
                <span className={`er-badge-action er-action-${selectedLog.action_type.toLowerCase()}`} style={{ margin: 0 }}>
                  {formatAction(selectedLog.action_type)}
                </span>
              </div>
            </div>
            <div className="er-meta-item">
              <span className="er-meta-label">Executed By</span>
              <div className="er-meta-value">{selectedLog.user_name || "System"}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{selectedLog.user_role}</div>
            </div>
            <div className="er-meta-item">
              <span className="er-meta-label">Date & Time</span>
              <div className="er-meta-value">{ts.date}</div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{ts.time}</div>
            </div>
          </div>

          <div className="er-section-title">Description</div>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#475569', lineHeight: '1.6', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {selectedLog.description}
          </p>

          <div className="er-section-title">DATA</div>
          {diffs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
              No data changes recorded for this action.
            </div>
          ) : (
            <div className="er-diff-boxes">
              <div className="er-diff-card">
                <div className="er-diff-header">
                  <span style={{ color: '#ef4444' }}>●</span> Previous State (Old Data)
                </div>
                {diffs.map(d => (
                  <div key={d.key} style={{ marginBottom: '12px' }}>
                    <span className="er-diff-key">{d.key}</span>
                    <div className={`er-val-box ${d.isRemoved ? 'er-val-removed' : ''}`}>
                      <span className="er-val-old" style={{ textDecoration: d.isAdded ? 'none' : 'line-through' }}>{d.oldVal}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="er-diff-card">
                <div className="er-diff-header">
                  <span style={{ color: '#22c55e' }}>●</span> Current State (New Data)
                </div>
                {diffs.map(d => (
                  <div key={d.key} style={{ marginBottom: '12px' }}>
                    <span className="er-diff-key">{d.key}</span>
                    <div className={`er-val-box ${d.isAdded ? 'er-val-added' : (d.isChanged ? 'er-val-changed' : '')}`}>
                      <span className="er-val-new" style={{ color: d.isRemoved ? '#ef4444' : '#0f172a' }}>{d.newVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="er-container">
      <style>{CSS}</style>

      <div className="er-header">
        <div className="er-title-group">
          <h1 className="er-title">Event Register</h1>
          <p className="er-subtitle">Audit trail of all administrative and system actions.</p>
        </div>
      </div>

      <div className="er-filter-bar">
        <div className="er-search-wrap">
          <div className="er-search-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input type="text" placeholder="Search History..." className="er-search" />
        </div>

        <select name="module_name" className="er-filter-sel" value={filters.module_name} onChange={handleFilterChange}>
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>

        <select name="action_type" className="er-filter-sel" value={filters.action_type} onChange={handleFilterChange}>
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{formatAction(a)}</option>)}
        </select>

        <div className="er-filter-divider" />

        <input type="date" name="date_from" className="er-filter-date" value={filters.date_from} onChange={handleFilterChange} title="From Date" />
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
        <input type="date" name="date_to" className="er-filter-date" value={filters.date_to} onChange={handleFilterChange} title="To Date" />

        <div className="er-filter-count">{logs.length} Records</div>
      </div>

      <div className="er-card">
        {loading ? (
          <div className="er-empty">Loading logs...</div>
        ) : error ? (
          <div className="er-empty" style={{ color: '#ef4444' }}>Error: {error.message}</div>
        ) : logs.length === 0 ? (
          <div className="er-empty">
             <div className="er-empty-icon">📂</div>
             <p>No event logs found matching your filters.</p>
          </div>
        ) : (
          <table className="er-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Timestamp</th>
                <th style={{ width: '150px' }}>Module</th>
                <th style={{ width: '150px' }}>Action</th>
                <th style={{ width: '210px' }}>Executed By</th>
                <th>Description</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const ts = formatTimestamp(log.timestamp);
                return (
                  <tr key={log.id} className="er-row-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td>
                      <div className="er-timestamp">
                        <div>{ts.date}</div>
                        <div className="er-timestamp-sub">{ts.time}</div>
                      </div>
                    </td>
                    <td>
                      <span className="er-badge-module">
                        {log.module_name}
                      </span>
                    </td>
                    <td>
                      <span className={`er-badge-action er-action-${log.action_type.toLowerCase()}`}>
                         {formatAction(log.action_type)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.user_name || "System"}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{log.user_role}</div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{log.description}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="er-btn-view" onClick={() => setSelectedLog(log)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) }
      </div>
    </div>
  );
}
