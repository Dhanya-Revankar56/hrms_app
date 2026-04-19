import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import type {
  Employee,
  Attendance,
  Leave,
  Movement,
  SessionTiming,
  EmployeeDocument,
  Settings,
  EventLog,
} from "../../types";
import { GET_EMPLOYEE_BY_ID } from "../../graphql/employeeQueries";
import { GET_ATTENDANCES } from "../../graphql/attendanceQueries";
import {
  GET_LEAVES,
  GET_LEAVE_BALANCES,
  APPLY_LEAVE,
} from "../../graphql/leaveQueries";
import { GET_MOVEMENTS, CREATE_MOVEMENT } from "../../graphql/movementQueries";
import { GET_EMPLOYEE_DOCUMENTS } from "../../graphql/documentQueries";
import { GET_EVENT_LOGS } from "../../graphql/eventLogQueries";
import { GET_SETTINGS } from "../../graphql/settingsQueries";

// Components
import HeaderSection from "./components/HeaderSection";
import SummaryTab from "./components/tabs/SummaryTab";
import AttendanceTab from "./components/tabs/AttendanceTab";
import MovementsTab from "./components/tabs/MovementsTab";
import LeavesTab from "./components/tabs/LeavesTab";
import DocumentsTab from "./components/tabs/DocumentsTab";
import EventRegisterTab from "./components/tabs/EventRegisterTab";

// Modals
import ApplyMovementModal from "./components/modals/ApplyMovementModal";
import ApplyLeaveModal from "./components/modals/ApplyLeaveModal";
import AttendanceDetailsModal from "./components/modals/AttendanceDetailsModal";
import AttendanceSettingsModal from "./components/modals/AttendanceSettingsModal";
import UpdateAttendanceStatusModal from "./components/modals/UpdateAttendanceStatusModal";
import UpdateShiftTimeModal from "./components/modals/UpdateShiftTimeModal";

// Utils
import { formatDateForDisplay } from "../../utils/dateUtils";

const CSS = `
.ed-container { padding: 24px; font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }
.ed-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; }

.ed-avatar-box { width: 80px; height: 80px; border-radius: 16px; background: #1e293b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
.ed-info-main { flex: 1; }
.ed-name-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.ed-name { font-size: 20px; font-weight: 700; color: #1e293b; }
.ed-status-badge { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.ed-meta { font-size: 14px; color: #64748b; display: flex; gap: 12px; align-items: center; }
.ed-meta-sep { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; }

.ed-tabs-row { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px; background: #f1f5f9; padding: 4px; border-radius: 10px; width: fit-content; overflow-x: auto; }
.ed-tab { padding: 8px 16px; border: none; background: transparent; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 8px; transition: 0.2s; white-space: nowrap; }
.ed-tab:hover { color: #1e293b; }
.ed-tab.active { background: #fff; color: #1d4ed8; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.ed-content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.ed-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.ed-sec-title { font-size: 14px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }

.ed-field { margin-bottom: 14px; }
.ed-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
.ed-value { font-size: 14px; font-weight: 600; color: #334155; }

.ed-back-btn { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 20px; background: none; border: none; padding: 0; }
.ed-back-btn:hover { color: #1e293b; }
.ed-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.ed-table th { text-align: left; padding: 14px 12px; font-size: 13.5px; font-weight: 700; color: #475569; border-bottom: 2px solid #f1f5f9; background: #f8fbff; white-space: nowrap; }
.ed-table td { padding: 14px 12px; border-bottom: 1.5px solid #f1f5f9; font-size: 14.5px; color: #334155; vertical-align: middle; font-weight: 500; }

.ed-att-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #fff; border-bottom: 2px solid #f1f5f9; }
.ed-month-nav { display: flex; align-items: center; gap: 16px; font-size: 16px; font-weight: 700; color: #1e293b; }
.ed-nav-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; transition: 0.2s; }
.ed-nav-btn:hover { color: #1e293b; background: #f1f5f9; border-radius: 4px; }

.ed-att-stats-box { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.4; }
.ed-stat-row { font-size: 13.5px; font-weight: 700; color: #1e293b; }
.ed-stat-lbl { color: #64748b; font-weight: 600; margin-right: 4px; }

.ed-day-info { display: flex; flex-direction: column; gap: 2px; }
.ed-day-date { font-weight: 700; color: #1e293b; font-size: 14px; }
.ed-day-name { font-size: 12px; color: #94a3b8; font-weight: 500; }

.ed-table-container { padding: 0 12px; }

.ed-pill { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
.ed-status-present { background: #f0fdf4; color: #16a34a; }
.ed-status-absent { background: #fef2f2; color: #dc2626; }
.ed-status-weekend { background: #fffbeb; color: #d97706; }
.ed-status-pending { background: #fff7ed; color: #f59e0b; }

.ed-salary-card { display: flex; flex-direction: column; gap: 12px; }
.ed-salary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
.ed-salary-item:last-child { border-bottom: none; }

.ed-time-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid #dbeafe;
  border-radius: 8px;
  background: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.1s;
}
.ed-time-trigger:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}
.ed-time-trigger svg { color: #64748b; }
.ed-time-trigger:hover svg { color: #3b82f6; }
.ed-salary-lbl { font-size: 13px; color: #64748b; font-weight: 500; }
.ed-salary-val { font-size: 14px; color: #1e293b; font-weight: 700; }

.ed-leave-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
.ed-leave-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 10px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.ed-leave-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -2px rgba(0,0,0,0.08); border-color: #3b82f6; }
.ed-leave-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
.ed-leave-info { flex: 1; min-width: 0; }
.ed-leave-type { font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-leave-stats { font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 1px; }
.ed-leave-used { font-size: 10px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 3px; }
.ed-used-val { color: #3b82f6; font-weight: 700; }

.ed-filter-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; flex-wrap: wrap; }
.ed-filter-item { display: flex; flex-direction: column; gap: 4px; }
.ed-filter-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.ed-select { height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; background: #f8fafc; outline: none; transition: 0.2s; }
.ed-select:focus { border-color: #3b82f6; background: #fff; }
.ed-date-input { height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; background: #f8fafc; outline: none; }

.ed-btn { height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #e2e8f0; background: #fff; color: #334155; transition: 0.2s; }
.ed-btn-primary { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
.ed-btn-primary:hover { background: #1e40af; }

.ed-pill { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap; }

.ed-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.ed-modal { background: #fff; border-radius: 16px; width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
.ed-modal-head { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.ed-modal-title { font-size: 16px; font-weight: 700; color: #1e293b; }
.ed-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.ed-modal-foot { padding: 16px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }

.ed-toggle-group { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px; }
.ed-toggle-btn { flex: 1; border: none; background: transparent; padding: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 7px; transition: 0.2s; }
.ed-toggle-btn.active { background: #fff; color: #1d4ed8; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.ed-session-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ed-session-option { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
.ed-session-option:hover { border-color: #cbd5e1; background: #f8fafc; }
.ed-session-option.active { border-color: #1d4ed8; background: #eff6ff; }
.ed-radio-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.ed-session-option.active .ed-radio-dot { border-color: #1d4ed8; }
.ed-session-option.active .ed-radio-dot::after { content: ''; width: 6px; height: 6px; background: #1d4ed8; border-radius: 50%; }
.ed-session-label { font-size: 13px; font-weight: 600; color: #334155; }
.ed-session-sub { font-size: 11px; color: #64748b; margin-top: 1px; }

.ed-mv-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 10px; border-radius:99px;
  font-size:11px; font-weight:700; white-space:nowrap;
  text-transform: uppercase;
}
.ed-mv-badge::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.75; }
.ed-mv-pending  { background:#fffbeb; color:#b45309; }
.ed-mv-approved { background:#f0fdf4; color:#15803d; }
.ed-mv-rejected { background:#fef2f2; color:#dc2626; }
.ed-alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; animation: ed-slide-down 0.3s ease-out; }
.ed-alert-error { background: #fef2f2; color: #dc2626; border: 1.5px solid #fee2e2; }
.ed-alert-success { background: #f0fdf4; color: #16a34a; border: 1.5px solid #dcfce7; }
.ed-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: ed-fade-in 0.2s ease; }
.ed-modal-card { background: #ffffff !important; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); padding: 24px; position: relative; z-index: 10000; color: #1e293b; }
.ed-modal-field { margin-bottom: 16px; }
.ed-modal-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
.ed-modal-input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500; outline: none; background: #fff; color: #1e293b; }
.ed-modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.ed-modal-select { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500; background: #fff; cursor: pointer; color: #1e293b; outline: none; }

.ed-face-setup { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: #f8fafc; }
.ed-face-label { font-size: 14px; color: #475569; font-weight: 600; }
.ed-face-icons { display: flex; gap: 16px; color: #64748b; }

.ed-template-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: block; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; }
.ed-template-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
.ed-template-table th { text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; border: none !important; background: transparent !important; padding: 0 4px !important; }
.ed-template-table td { padding: 4px 4px; font-size: 13px; vertical-align: middle; border: none; }
.ed-td-day { font-weight: 600; color: #475569; width: 100px; }
.ed-td-time { font-weight: 600; color: #1e293b; text-align: center; background: #f1f5f9; border-radius: 6px; padding: 4px 10px !important; }
.ed-td-action { text-align: right; color: #3b82f6; cursor: pointer; padding-left: 12px !important; position: relative; }

.ed-action-dropdown {
  position: absolute;
  right: 12px;
  top: 40px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  z-index: 1000;
  width: 170px;
  overflow: hidden;
  animation: ed-slide-down 0.2s ease-out;
}
.ed-action-item {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.1s;
  text-align: left;
  width: 100%;
  background: none;
  border: none;
}
.ed-action-item:hover { background: #f8fafc; color: #1d4ed8; }
.ed-action-item svg { color: #94a3b8; }
.ed-action-item:hover svg { color: #3b82f6; }

.ed-details-header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; }
.ed-details-title { font-size: 18px; font-weight: 700; color: #1e293b; }
.ed-details-section { margin-bottom: 24px; }
.ed-details-sec-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px; }
.ed-details-grid { display: flex; flex-direction: column; gap: 14px; }
.ed-details-row { display: grid; grid-template-columns: 120px 80px 1fr; align-items: center; font-size: 14px; }
.ed-details-label { font-weight: 600; color: #64748b; }
.ed-details-time { font-weight: 700; color: #1e293b; text-align: center; }
.ed-details-status { font-weight: 600; color: #94a3b8; padding-left: 20px; }
.ed-details-punch-link { color: #3b82f6; font-size: 13.5px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
.ed-details-punch-link:hover { text-decoration: underline; }

.ed-status-modal-note { padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 20px; }
.ed-status-modal-note span { font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; }
.ed-status-modal-note p { font-size: 12px; font-weight: 500; color: #64748b; margin: 0; line-height: 1.5; }

.ed-modal-card.wide { max-width: 900px; width: 95%; }
.ed-timing-grid { width: 100%; margin-top: 10px; }
.ed-t-header { display: grid; grid-template-columns: 140px 1fr 1fr 1fr 40px; gap: 20px; padding: 12px 0; border-bottom: 1.5px solid #f1f5f9; text-align: center; }
.ed-t-header span { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

.ed-t-row { display: grid; grid-template-columns: 140px 1fr 1fr 1fr 40px; gap: 20px; align-items: center; padding: 166px 0; }
.ed-t-label { font-size: 14px; font-weight: 600; color: #475569; }
.ed-t-input-group { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 10px; transition: 0.2s; }
.ed-t-input-group:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.ed-t-input { width: 100%; border: none; padding: 10px 0; outline: none; font-size: 15px; font-weight: 600; color: #1e293b; background: transparent; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif; letter-spacing: -0.01em; }
.ed-t-icon { color: #94a3b8; margin-left: 8px; }

.ed-t-trash { background: none; border: none; color: #f87171; cursor: pointer; padding: 6px; display: flex; align-items: center; transition: 0.2s; border-radius: 6px; }
.ed-t-trash:hover { background: #fef2f2; }

@keyframes ed-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ed-slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.er-timeline { padding: 8px 16px; margin: 0; width: 100%; position: relative; display: flex; flex-direction: column; gap: 32px; }
.er-timeline::before { content: ''; position: absolute; left: 32px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
.er-timeline-item { display: flex; gap: 24px; position: relative; }
.er-timeline-dot { width: 32px; height: 32px; background: #fff; border: 2.5px solid #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; position: relative; z-index: 2; color: #64748b; font-weight: 800; transition: 0.3s; flex-shrink: 0; }
.er-timeline-item:hover .er-timeline-dot { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
.er-item-joined .er-timeline-dot { border-color: #10b981; color: #10b981; }
.er-item-relieved .er-timeline-dot { border-color: #ef4444; color: #ef4444; }

.er-tl-card { flex: 1; background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px 20px; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.er-tl-card:hover { border-color: #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.er-tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.er-tl-action { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
.er-tl-desc { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; }
.er-tl-meta { display: flex; gap: 16px; font-size: 12px; color: #64748b; align-items: center; }
.er-tl-user { display: flex; align-items: center; gap: 6px; }
.er-tl-btn { padding: 4px 12px; font-size: 11px; font-weight: 700; color: #4f46e5; background: #eef2ff; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.er-tl-btn:hover { background: #4f46e5; color: #fff; }

.er-badge-action { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.er-action-joined { background: #dcfce7; color: #166534; }
.er-action-updated { background: #dbeafe; color: #1e40af; }
.er-action-deleted { background: #fee2e2; color: #991b1b; }
.er-action-relieved { background: #fef9c3; color: #854d0e; }
.er-action-created { background: #eff6ff; color: #1d4ed8; }
.er-empty-lc { padding: 80px 20px; color: #94a3b8; text-align: center; display: flex; flex-direction: column; align-items: center; }
.er-empty-lc .er-empty-icon { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }
`;

const MODULE_MAP: Record<string, string> = {
  employee: "Employee Management",
  onboarding: "Employee Onboarding",
  leave: "Leave Management",
  attendance: "Attendance",
  movement: "Movement Register",
  relieving: "Relieving",
  settings: "Settings",
  holiday: "Holidays",
};

type TabType =
  | "Summary"
  | "Attendance"
  | "Movements"
  | "Leaves"
  | "Documents"
  | "Event Register";

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    const d = new Date(date);
    const iso =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    days.push({
      iso,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
      dateLabel:
        d.getDate() +
        " " +
        d.toLocaleDateString("en-US", { month: "short" }) +
        " " +
        d.getFullYear(),
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export default function EmployeeDetail({ forcedTab }: { forcedTab?: TabType }) {
  const { id: paramId } = useParams();

  let id = paramId as string;
  if (!id) {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      id = u.id || localStorage.getItem("user_id") || "";
    } catch {
      id = "";
    }
  }

  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activeTab, setActiveTab] = useState<TabType>(forcedTab || "Summary");

  useEffect(() => {
    if (forcedTab) {
      setTimeout(() => setActiveTab(forcedTab), 0);
    }
  }, [forcedTab]);

  const [lcFilterFrom, setLcFilterFrom] = useState("");
  const [lcFilterTo, setLcFilterTo] = useState("");

  const [yearNum, monthNum] = useMemo(
    () => monthYear.split("-").map(Number),
    [monthYear],
  );
  const daysInMonth = useMemo(
    () => getDaysInMonth(yearNum, monthNum - 1),
    [yearNum, monthNum],
  );

  const { data: empData, loading: empLoading } = useQuery<{
    employee: Employee;
  }>(GET_EMPLOYEE_BY_ID, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const { data: settingsData } = useQuery<{ settings: Settings }>(GET_SETTINGS);
  const leaveTypes = useMemo(
    () => settingsData?.settings?.leave_types || [],
    [settingsData],
  );

  const { data: attendanceData } = useQuery<{
    attendances: { items: Attendance[] };
  }>(GET_ATTENDANCES, {
    variables: {
      employee_id: id,
      from_date: daysInMonth[0].iso,
      to_date: daysInMonth[daysInMonth.length - 1].iso,
    },
    skip: activeTab !== "Attendance",
  });

  const { data: leavesData } = useQuery<{ leaves: { items: Leave[] } }>(
    GET_LEAVES,
    {
      variables: { employee_id: id },
      skip: activeTab !== "Leaves",
    },
  );

  const { data: balanceData } = useQuery<{
    leaveBalances: Array<{ leave_type: string; balance: number }>;
  }>(GET_LEAVE_BALANCES, {
    variables: { employee_id: id },
    skip: activeTab !== "Leaves",
  });

  const { data: lifecycleData, loading: lifecycleLoading } = useQuery<{
    eventLogs: { items: EventLog[] };
  }>(GET_EVENT_LOGS, {
    variables: {
      record_id: id,
      date_from: lcFilterFrom || undefined,
      date_to: lcFilterTo || undefined,
      pagination: { page: 1, limit: 100 },
    },
    skip: activeTab !== "Event Register",
    fetchPolicy: "network-only",
  });

  const lifecycleLogs = lifecycleData?.eventLogs?.items || [];

  const exportLifecycleCsv = () => {
    if (!lifecycleLogs.length) return;
    const header = [
      "Date",
      "Time",
      "Module",
      "Action",
      "Description",
      "Executed By",
    ];

    // Define a localized formatting helper since the main one is further down
    const _formatAction = (action: string) => {
      if (!action) return "Activity";
      if (action.includes("_"))
        return action
          .split("_")
          .map(
            (p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
          )
          .join(" ");
      return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    };

    const _formatTimestamp = (ts: string) => {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return { date: "Invalid", time: "" };
      return {
        date: d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        time: d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    };

    const rows = lifecycleLogs.map((log: EventLog) => {
      const ts = _formatTimestamp(log.timestamp);
      return [
        '"' + ts.date + '"',
        '"' + ts.time + '"',
        '"' + (MODULE_MAP[log.module_name] || log.module_name) + '"',
        '"' + _formatAction(log.action_type) + '"',
        '"' + (log.description || "").replace(/"/g, '""') + '"',
        '"' + log.user_name + " (" + log.user_role + ")" + '"',
      ].join(",");
    });

    const csvContext = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContext], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Employee_${id}_Event_Register_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [applyLeave] = useMutation(APPLY_LEAVE, {
    refetchQueries: [
      { query: GET_LEAVES, variables: { employee_id: id } },
      { query: GET_LEAVE_BALANCES, variables: { employee_id: id } },
    ],
  });

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [applyForm, setApplyForm] = useState({
    leave_type: "",
    from_date: "",
    to_date: "",
    reason: "",
  });

  const [applyDaysData, setApplyDaysData] = useState<
    { date: string; type: string }[]
  >([]);
  const applyLastRange = useRef({ from: "", to: "" });

  useEffect(() => {
    if (!applyForm.from_date || !applyForm.to_date) {
      setTimeout(() => setApplyDaysData([]), 0);
      applyLastRange.current = { from: "", to: "" };
      return;
    }
    if (
      applyLastRange.current.from === applyForm.from_date &&
      applyLastRange.current.to === applyForm.to_date
    )
      return;

    const start = new Date(applyForm.from_date);
    const end = new Date(applyForm.to_date);
    if (end < start || isNaN(start.getTime()) || isNaN(end.getTime())) {
      setTimeout(() => setApplyDaysData([]), 0);
      return;
    }

    applyLastRange.current = {
      from: applyForm.from_date,
      to: applyForm.to_date,
    };

    setTimeout(() => {
      setApplyDaysData((prev) => {
        const list: { date: string; type: string }[] = [];
        const curr = new Date(start);
        while (curr <= end) {
          const dStr = curr.toISOString().split("T")[0];
          const existing = prev.find((d) => d.date === dStr);
          list.push({ date: dStr, type: existing?.type || "Full Day" });
          curr.setDate(curr.getDate() + 1);
        }
        return list;
      });
    }, 0);
  }, [applyForm.from_date, applyForm.to_date]);

  const applyTotalDays = useMemo(() => {
    return applyDaysData.reduce(
      (acc, d) => acc + (d.type === "Full Day" ? 1 : 0.5),
      0,
    );
  }, [applyDaysData]);

  const initialDefaultDone = useRef(false);
  useEffect(() => {
    if (
      leaveTypes.length > 0 &&
      !applyForm.leave_type &&
      !initialDefaultDone.current
    ) {
      initialDefaultDone.current = true;
      setTimeout(() => {
        setApplyForm((prev) => ({ ...prev, leave_type: leaveTypes[0].name }));
      }, 0);
    }
  }, [leaveTypes, applyForm.leave_type]);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [showRet, setShowRet] = useState(false);
  const [mStatus, setMStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showAttSettingsModal, setShowAttSettingsModal] = useState(false);
  const [biometricId, setBiometricId] = useState("200");
  const [selectedShift, setSelectedShift] = useState("Teaching Staff");
  const [template, setTemplate] = useState([
    { day: "Sunday", checkin: "", checkout: "", isWeekOff: true },
    { day: "Monday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Tuesday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Wednesday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Thursday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Friday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
    { day: "Saturday", checkin: "08:55", checkout: "17:30", isWeekOff: false },
  ]);

  const formatTo12Hr = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    let hours = parseInt(h);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, "0")}:${m} ${ampm}`;
  };
  const [showDetailEditModal, setShowDetailEditModal] = useState(false);
  const [showAttendanceDetailsModal, setShowAttendanceDetailsModal] =
    useState(false);
  const [selectedDetailsDate, setSelectedDetailsDate] = useState<string>("");
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [updateStatusValue, setUpdateStatusValue] = useState("PRESENT");
  const [showUpdateShiftTimeModal, setShowUpdateShiftTimeModal] =
    useState(false);
  const [selectedSession, setSelectedSession] = useState("Check In");
  const [updateReason, setUpdateReason] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // Handle dropdown close
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [detailTimingData, setDetailTimingData] = useState<SessionTiming[]>([
    {
      label: "Check In",
      before: "08:30",
      marking: "08:55",
      after: "09:30",
      isOptional: false,
    },
    {
      label: "Intermediate 1",
      before: "12:30",
      marking: "12:30",
      after: "13:00",
      isOptional: true,
    },
    {
      label: "Intermediate 2",
      before: "14:15",
      marking: "14:25",
      after: "15:00",
      isOptional: true,
    },
    {
      label: "Check Out",
      before: "17:00",
      marking: "17:30",
      after: "17:45",
      isOptional: false,
    },
  ]);
  const [moveForm, setMoveForm] = useState({
    movement_date: new Date().toISOString().split("T")[0],
    movement_type: "official",
    out_time: "09:00",
    in_time: "10:00",
    purpose: "",
    remarks: "",
  });

  const [applyMovement, { loading: mLoading }] = useMutation(CREATE_MOVEMENT, {
    refetchQueries: [{ query: GET_MOVEMENTS, variables: { employee_id: id } }],
  });

  const { data: movementsData } = useQuery<{
    movements: { items: Movement[] };
  }>(GET_MOVEMENTS, {
    variables: { employee_id: id },
    skip: activeTab !== "Movements",
  });

  const { data: docsData } = useQuery<{
    employeeDocuments: EmployeeDocument[];
  }>(GET_EMPLOYEE_DOCUMENTS, {
    variables: { employee_id: id },
    skip: activeTab !== "Documents",
  });
  const getLeaveCode = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("casual")) return "CL";
    if (n.includes("official duty")) return "OOD";
    if (n.includes("sick")) return "SL";
    if (n.includes("paid")) return "PL";
    if (n.includes("maternity") || n.includes("meternity")) return "ML";
    if (n.includes("paternity")) return "Pat_L";
    return name;
  };

  const getLeaveName = (type: string) => {
    const code = getLeaveCode(type);
    const names: Record<string, string> = {
      CL: "Casual Leave",
      OOD: "On Official Duty",
      SL: "Sick Leave",
      PL: "Paid Leave",
      ML: "Maternity Leave",
      Pat_L: "Paternity Leave",
    };
    return names[code] || type;
  };

  const to12 = (t: string): string => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
  };

  const tdiff = (a: string, b: string): string => {
    if (!a || !b) return "—";
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const d = bh * 60 + bm - (ah * 60 + am);
    if (d <= 0) return "—";
    return Math.floor(d / 60) > 0
      ? `${Math.floor(d / 60)}h ${d % 60}m`
      : `${d}m`;
  };

  const employee = empData?.employee;

  const handleApplyMovement = async () => {
    setMStatus(null);
    if (!moveForm.movement_date) {
      setMStatus({ message: "Please select a date.", type: "error" });
      return;
    }
    const sd = new Date(moveForm.movement_date);
    if (sd.getDay() === 0) {
      setMStatus({
        message: "Movements cannot be applied on Sundays.",
        type: "error",
      });
      return;
    }
    if (!moveForm.out_time || !moveForm.in_time || !moveForm.purpose.trim()) {
      setMStatus({
        message: "Please fill all required fields.",
        type: "error",
      });
      return;
    }
    const [outH, outM] = moveForm.out_time.split(":").map(Number);
    const [inH, inM] = moveForm.in_time.split(":").map(Number);
    const nStart = outH * 60 + outM;
    const nEnd = inH * 60 + inM;
    if (nEnd <= nStart) {
      setMStatus({
        message: "Return time must be after out time.",
        type: "error",
      });
      return;
    }
    const existMv = movementsData?.movements?.items || [];
    const mvOverlap = existMv.some((m: Movement) => {
      const s = (m.status || "").toLowerCase();
      if (s === "rejected" || s === "cancelled") return false;
      if (m.movement_date.split("T")[0] !== moveForm.movement_date)
        return false;
      const [outHStr, outMStr] = m.out_time.split(":");
      const [inHStr, inMStr] = (m.in_time || "23:59").split(":");
      const [exOH, exOM] = [Number(outHStr), Number(outMStr)];
      const [exIH, exIM] = [Number(inHStr), Number(inMStr)];
      return nStart < exIH * 60 + exIM && nEnd > exOH * 60 + exOM;
    });
    if (mvOverlap) {
      setMStatus({
        message: "You already have a movement scheduled during this time.",
        type: "error",
      });
      return;
    }
    try {
      await applyMovement({
        variables: {
          input: {
            employee_id: id || "",
            employee_code: employee?.employee_id || "",
            movement_date: moveForm.movement_date,
            movement_type: moveForm.movement_type,
            out_time: moveForm.out_time,
            in_time: moveForm.in_time || null,
            purpose: moveForm.purpose,
            remarks: moveForm.remarks,
          },
        },
      });
      setMStatus({
        message: "Movement applied successfully!",
        type: "success",
      });
      setTimeout(() => {
        setShowMovementModal(false);
        setMStatus(null);
        setMoveForm({
          movement_date: new Date().toISOString().split("T")[0],
          movement_type: "official",
          out_time: "09:00",
          in_time: "10:00",
          purpose: "",
          remarks: "",
        });
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMStatus({ message: error.message || "Error applying", type: "error" });
    }
  };

  const handleApplyLeave = async () => {
    setStatus(null);
    const newFrom = applyForm.from_date;
    const newTo = applyForm.to_date;
    if (!newFrom || !newTo) {
      setStatus({ message: "Please select dates.", type: "error" });
      return;
    }
    const lStart = new Date(newFrom);
    const lEnd = new Date(newTo);
    if (lEnd < lStart) {
      setStatus({
        message: "To Date cannot be before From Date.",
        type: "error",
      });
      return;
    }
    const existingLeaves = leavesData?.leaves?.items || [];
    const leaveOverlap = existingLeaves.some((l: Leave) => {
      const s = (l.status || "").toLowerCase();
      if (s === "rejected" || s === "cancelled") return false;
      return lStart <= new Date(l.to_date) && lEnd >= new Date(l.from_date);
    });
    if (leaveOverlap) {
      setStatus({
        message: "You have already applied for leave during this period.",
        type: "error",
      });
      return;
    }
    const day_breakdowns = applyDaysData.map(
      (d: { date: string; type: string }) => ({
        date: d.date,
        leave_type: d.type,
      }),
    );
    try {
      await applyLeave({
        variables: {
          input: {
            leave_type: applyForm.leave_type,
            from_date: newFrom,
            to_date: newTo,
            reason: applyForm.reason,
            employee_id: id || "",
            day_breakdowns,
          },
        },
      });
      setStatus({ message: "Leave applied successfully!", type: "success" });
      setTimeout(() => {
        setShowApplyModal(false);
        setStatus(null);
        setApplyForm({
          leave_type: leaveTypes[0]?.name || "",
          from_date: "",
          to_date: "",
          reason: "",
        });
        setApplyDaysData([]);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatus({ message: error.message || "Error applying", type: "error" });
    }
  };

  if (empLoading) return <div className="ed-container">Loading details...</div>;
  if (!employee) return <div className="ed-container">Employee not found.</div>;

  const initials =
    `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="ed-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <HeaderSection
        employee={employee}
        initials={initials}
        forcedTab={forcedTab}
      />

      {!forcedTab && (
        <div className="ed-tabs-row">
          {(
            [
              "Summary",
              "Attendance",
              "Movements",
              "Leaves",
              "Documents",
              "Event Register",
            ] as TabType[]
          ).map((tab) => (
            <button
              key={tab}
              className={`ed-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div className="ed-content">
        {activeTab === "Summary" && <SummaryTab empData={empData} />}
        {activeTab === "Attendance" && (
          <AttendanceTab
            attendanceData={attendanceData}
            monthYear={monthYear}
            setMonthYear={setMonthYear}
            setShowAttSettingsModal={setShowAttSettingsModal}
            setShowUpdateStatusModal={setShowUpdateStatusModal}
            setShowAttendanceDetailsModal={setShowAttendanceDetailsModal}
            daysInMonth={daysInMonth}
            setShowUpdateShiftTimeModal={setShowUpdateShiftTimeModal}
            setSelectedDetailsDate={setSelectedDetailsDate}
          />
        )}
        {activeTab === "Movements" && (
          <MovementsTab
            movementsData={movementsData}
            setShowMovementModal={setShowMovementModal}
          />
        )}
        {activeTab === "Leaves" && (
          <LeavesTab
            leavesData={leavesData}
            setShowApplyModal={setShowApplyModal}
            leaveTypes={leaveTypes}
            leaveBalances={balanceData?.leaveBalances}
          />
        )}
        {activeTab === "Documents" && <DocumentsTab docsData={docsData} />}
        {activeTab === "Event Register" && (
          <EventRegisterTab
            lifecycleLogs={lifecycleLogs}
            lcFilterFrom={lcFilterFrom}
            lcFilterTo={lcFilterTo}
            setLcFilterFrom={setLcFilterFrom}
            setLcFilterTo={setLcFilterTo}
            exportLifecycleCsv={exportLifecycleCsv}
            lifecycleLoading={lifecycleLoading}
          />
        )}
      </div>

      <ApplyMovementModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onSubmit={handleApplyMovement}
        moveForm={moveForm}
        setMoveForm={setMoveForm}
        mStatus={mStatus}
        mLoading={mLoading}
        showOut={showOut}
        setShowOut={setShowOut}
        showRet={showRet}
        setShowRet={setShowRet}
        to12={to12}
        tdiff={tdiff}
      />
      <ApplyLeaveModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setStatus(null);
        }}
        onSubmit={handleApplyLeave}
        applyForm={applyForm}
        setApplyForm={setApplyForm}
        status={status}
        applyDaysData={applyDaysData}
        setApplyDaysData={setApplyDaysData}
        applyTotalDays={applyTotalDays}
        leaveTypes={leaveTypes}
        getLeaveName={getLeaveName}
        empLoading={empLoading}
      />
      <AttendanceDetailsModal
        isOpen={showAttendanceDetailsModal}
        onClose={() => setShowAttendanceDetailsModal(false)}
        selectedDetailsDate={selectedDetailsDate}
        formatDateForDisplay={formatDateForDisplay}
      />

      <AttendanceSettingsModal
        isOpen={showAttSettingsModal}
        onClose={() => setShowAttSettingsModal(false)}
        biometricId={biometricId}
        setBiometricId={setBiometricId}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
      />
      {showDetailEditModal && (
        <div className="ed-modal-overlay" style={{ zIndex: 11000 }}>
          <div className="ed-modal-card wide">
            <span
              className="ed-template-title"
              style={{ fontSize: "18px", border: "none" }}
            >
              Update Shift - {selectedDetailsDate}
            </span>

            <div className="ed-timing-grid">
              <div className="ed-t-header">
                <div></div>
                <span>Leisure before</span>
                <span>Marking time</span>
                <span>Leisure after</span>
                <div></div>
              </div>

              {detailTimingData.map((session, idx) => (
                <div className="ed-t-row" key={idx}>
                  <div className="ed-t-label">{session.label}</div>
                  <div className="ed-t-input-group">
                    <input
                      type="text"
                      className="ed-t-input"
                      value={formatTo12Hr(session.before)}
                      onChange={(e) => {
                        // Basic parsing: if user types "01:30 PM" -> "13:30"
                        // For now, let's keep it simple and just allow editing in a text field
                        // Realistically, for a professional UI, we might want a better picker,
                        // but here we respond to the '12 hours cycle' request.
                        const newVal = e.target.value;
                        const newD = [...detailTimingData];
                        newD[idx].before_display = newVal; // Temporary state for raw input if needed
                        // For simplicity, we'll try to parse or just store the 24h equivalent logic
                        setDetailTimingData(newD);
                      }}
                      onBlur={(e) => {
                        // On blur, attempt to convert back to HH:mm for internal state
                        const val = e.target.value;
                        const matched = val.match(
                          /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
                        );
                        if (matched) {
                          let h = parseInt(matched[1]);
                          const m = matched[2];
                          const ap = matched[3].toUpperCase();
                          if (ap === "PM" && h < 12) h += 12;
                          if (ap === "AM" && h === 12) h = 0;
                          const newD = [...detailTimingData];
                          newD[idx].before =
                            `${h.toString().padStart(2, "0")}:${m}`;
                          setDetailTimingData(newD);
                        }
                      }}
                    />
                    <svg
                      className="ed-t-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="ed-t-input-group">
                    <input
                      type="text"
                      className="ed-t-input"
                      value={formatTo12Hr(session.marking)}
                      onChange={(e) => {
                        const newD = [...detailTimingData];
                        newD[idx].marking_display = e.target.value;
                        setDetailTimingData(newD);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        const matched = val.match(
                          /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
                        );
                        if (matched) {
                          let h = parseInt(matched[1]);
                          const m = matched[2];
                          const ap = matched[3].toUpperCase();
                          if (ap === "PM" && h < 12) h += 12;
                          if (ap === "AM" && h === 12) h = 0;
                          const newD = [...detailTimingData];
                          newD[idx].marking =
                            `${h.toString().padStart(2, "0")}:${m}`;
                          setDetailTimingData(newD);
                        }
                      }}
                    />
                    <svg
                      className="ed-t-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="ed-t-input-group">
                    <input
                      type="text"
                      className="ed-t-input"
                      value={formatTo12Hr(session.after)}
                      onChange={(e) => {
                        const newD = [...detailTimingData];
                        newD[idx].after_display = e.target.value;
                        setDetailTimingData(newD);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        const matched = val.match(
                          /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
                        );
                        if (matched) {
                          let h = parseInt(matched[1]);
                          const m = matched[2];
                          const ap = matched[3].toUpperCase();
                          if (ap === "PM" && h < 12) h += 12;
                          if (ap === "AM" && h === 12) h = 0;
                          const newD = [...detailTimingData];
                          newD[idx].after =
                            `${h.toString().padStart(2, "0")}:${m}`;
                          setDetailTimingData(newD);
                        }
                      }}
                    />
                    <svg
                      className="ed-t-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    {session.isOptional && (
                      <button
                        className="ed-t-trash"
                        onClick={() => {
                          const newD = detailTimingData.filter(
                            (_, i) => i !== idx,
                          );
                          setDetailTimingData(newD);
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              <input
                type="checkbox"
                id="applyAllDays"
                style={{ cursor: "pointer" }}
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <label
                htmlFor="applyAllDays"
                style={{
                  fontSize: "14px",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Apply to all days
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 40,
                justifyContent: "flex-end",
              }}
            >
              <button
                className="ed-btn"
                style={{ width: 120, justifyContent: "center" }}
                onClick={() => setShowDetailEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="ed-btn"
                style={{
                  width: 120,
                  justifyContent: "center",
                  background: "#00264d",
                  color: "#fff",
                }}
                onClick={() => {
                  const newTemplate = [...template];
                  const checkInRow = detailTimingData.find(
                    (d) => d.label === "Check In",
                  );
                  const checkOutRow = detailTimingData.find(
                    (d) => d.label === "Check Out",
                  );

                  if (applyToAll) {
                    newTemplate.forEach((t) => {
                      if (!t.isWeekOff) {
                        if (checkInRow) t.checkin = checkInRow.marking;
                        if (checkOutRow) t.checkout = checkOutRow.marking;
                      }
                    });
                  } else {
                    const dayIdx = newTemplate.findIndex(
                      (t) => t.day === selectedDetailsDate,
                    );
                    if (dayIdx > -1) {
                      if (checkInRow)
                        newTemplate[dayIdx].checkin = checkInRow.marking;
                      if (checkOutRow)
                        newTemplate[dayIdx].checkout = checkOutRow.marking;
                      setTemplate(newTemplate);
                    }
                  }
                  setTemplate(newTemplate);
                  setShowDetailEditModal(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <AttendanceDetailsModal
        isOpen={showAttendanceDetailsModal}
        onClose={() => setShowAttendanceDetailsModal(false)}
        selectedDetailsDate={selectedDetailsDate}
        formatDateForDisplay={formatDateForDisplay}
      />
      <UpdateAttendanceStatusModal
        isOpen={showUpdateStatusModal}
        onClose={() => setShowUpdateStatusModal(false)}
        onSubmit={() => {
          setShowUpdateStatusModal(false);
        }}
        updateStatusValue={updateStatusValue}
        setUpdateStatusValue={setUpdateStatusValue}
      />
      <UpdateShiftTimeModal
        isOpen={showUpdateShiftTimeModal}
        onClose={() => setShowUpdateShiftTimeModal(false)}
        onSubmit={() => {
          setShowUpdateShiftTimeModal(false);
        }}
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        updateReason={updateReason}
        setUpdateReason={setUpdateReason}
      />
    </div>
  );
}
