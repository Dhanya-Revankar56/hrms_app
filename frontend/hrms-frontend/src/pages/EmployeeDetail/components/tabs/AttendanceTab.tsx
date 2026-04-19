import React from "react";
import { isAdmin, isHod } from "../../../../utils/auth";
import type { Attendance } from "../../../../types";

interface AttendanceTabProps {
  attendanceData: { attendances: { items: Attendance[] } } | undefined;
  monthYear: string;
  setMonthYear: (val: string) => void;
  setShowAttSettingsModal: (val: boolean) => void;
  setShowUpdateStatusModal: (val: boolean) => void;
  setShowAttendanceDetailsModal: (val: boolean) => void;
  daysInMonth: {
    iso: string;
    dayNumber: number;
    dayName: string;
    dateLabel: string;
  }[];
  setShowUpdateShiftTimeModal: (val: boolean) => void;
  setSelectedDetailsDate: (val: string) => void;
}

export default function AttendanceTab({
  attendanceData,
  monthYear,
  setMonthYear,
  setShowAttSettingsModal,
  setShowUpdateStatusModal,
  setShowAttendanceDetailsModal,
  daysInMonth,
  setShowUpdateShiftTimeModal,
  setSelectedDetailsDate,
}: AttendanceTabProps) {
  const [selectedDates, setSelectedDates] = React.useState<string[]>([]);

  const to12 = (t: string): string => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
  };

  return (
    <>
      <div className="ed-section" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ed-att-toolbar">
          <div className="ed-month-nav">
            <button
              className="ed-nav-btn"
              onClick={() => {
                const d = new Date(monthYear + "-01");
                d.setMonth(d.getMonth() - 1);
                setMonthYear(d.toISOString().slice(0, 7));
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span>
              {new Date(monthYear + "-01").toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              className="ed-nav-btn"
              onClick={() => {
                const d = new Date(monthYear + "-01");
                d.setMonth(d.getMonth() + 1);
                setMonthYear(d.toISOString().slice(0, 7));
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="ed-att-stats-box">
            <div className="ed-stat-row">
              <span className="ed-stat-lbl">Total Late Mins :</span> 0
            </div>
            <div className="ed-stat-row">
              <span className="ed-stat-lbl">Balance Late Mins :</span> 100
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {(isAdmin() || isHod()) && (
              <>
                <button
                  className="ed-btn"
                  title="History"
                  onClick={() => {
                    if (selectedDates.length === 0) {
                      alert("Please select at least one date to update.");
                      return;
                    }
                    setShowUpdateShiftTimeModal(true);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </button>
                <button
                  className="ed-btn"
                  title="Edit Record"
                  onClick={() => {
                    if (selectedDates.length === 0) {
                      alert("Please select at least one date to update.");
                      return;
                    }
                    setShowUpdateStatusModal(true);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
            <button className="ed-btn" title="Download">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
            {(isAdmin() || isHod()) && (
              <button
                className="ed-btn"
                title="Settings"
                onClick={() => setShowAttSettingsModal(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="ed-table-container" style={{ overflowX: "auto" }}>
          <table className="ed-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedDates.length === daysInMonth.length &&
                      daysInMonth.length > 0
                    }
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          selectedDates.length > 0 &&
                          selectedDates.length < daysInMonth.length;
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDates(
                          daysInMonth.map((d: { iso: string }) => d.iso),
                        );
                      } else {
                        setSelectedDates([]);
                      }
                    }}
                  />
                </th>
                <th style={{ width: 180 }}>Date</th>
                <th style={{ width: 160 }}>Check in</th>
                <th style={{ width: 120 }}>I</th>
                <th style={{ width: 140 }}>II</th>
                <th style={{ width: 160 }}>Check out</th>
                <th style={{ width: 180 }}>Last updated by</th>
                <th style={{ width: 140, textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...daysInMonth].reverse().map((day) => {
                const record = attendanceData?.attendances?.items?.find(
                  (r) => r.date === day.iso,
                );
                const isWeekend = day.dayName === "Sunday";

                let statusLabel = record?.status || "NOT MARKED";
                let statusClass = "ed-status-pending";

                if (isWeekend) {
                  statusLabel = "WEEK_OFF";
                  statusClass = "ed-status-weekend";
                } else if (!record) {
                  statusLabel = "ABSENT";
                  statusClass = "ed-status-absent";
                } else if (record.status?.toLowerCase() === "present") {
                  statusLabel = "PRESENT";
                  statusClass = "ed-status-present";
                } else if (record.status?.toLowerCase() === "absent") {
                  statusLabel = "ABSENT";
                  statusClass = "ed-status-absent";
                }

                return (
                  <tr key={day.iso}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(day.iso)}
                        onChange={() => {
                          if (selectedDates.includes(day.iso)) {
                            setSelectedDates(
                              selectedDates.filter(
                                (d: string) => d !== day.iso,
                              ),
                            );
                          } else {
                            setSelectedDates([...selectedDates, day.iso]);
                          }
                        }}
                      />
                    </td>
                    <td>
                      <div className="ed-day-info">
                        <span className="ed-day-date">{day.dateLabel}</span>
                        <span className="ed-day-name">{day.dayName}</span>
                      </div>
                    </td>
                    <td>
                      {record?.check_in
                        ? to12(record.check_in)
                        : isWeekend
                          ? "Week Off"
                          : "-"}
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      {record?.check_out
                        ? to12(record.check_out)
                        : isWeekend
                          ? "Week Off"
                          : "-"}
                    </td>
                    <td>{record?.marked_by || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`ed-pill ${statusClass}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedDetailsDate(day.iso);
                          setShowAttendanceDetailsModal(true);
                        }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
