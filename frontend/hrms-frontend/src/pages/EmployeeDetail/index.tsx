import {
  Employee,
  Attendance,
  Leave,
  Movement,
  SessionTiming,
  EmployeeDocument,
  Settings,
  EventLog,
} from "../../types";

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
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      iso,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
      dateLabel: `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`,
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

  const [docFilter, setDocFilter] = useState("All");
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
        `"${ts.date}"`,
        `"${ts.time}"`,
        `"${MODULE_MAP[log.module_name] || log.module_name}"`,
        `"${_formatAction(log.action_type)}"`,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        `"${log.user_name} (${log.user_role})"`,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getLeaveMeta = (code: string) => {
    const meta: Record<string, { bg: string; color: string }> = {
      CL: { bg: "#eff6ff", color: "#1d4ed8" },
      OOD: { bg: "#f0fdff", color: "#0891b2" },
      SL: { bg: "#fffbeb", color: "#b45309" },
      PL: { bg: "#f0fdf4", color: "#15803d" },
      ML: { bg: "#fdf2f8", color: "#db2777" },
      Pat_L: { bg: "#f5f3ff", color: "#7c3aed" },
      Other: { bg: "#f8fafc", color: "#64748b" },
    };
    return meta[code] || meta["Other"];
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getUsedCount = (typeName: string, leaves: Leave[] = []) => {
    const targetCode = getLeaveCode(typeName);
    return leaves
      .filter((l) => {
        const lCode = getLeaveCode(l.leave_type);
        return (
          lCode === targetCode && (l.status || "").toLowerCase() === "approved"
        );
      })
      .reduce((sum: number, l) => sum + (l.total_days || 0), 0);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatAction = (action: string) => {
    if (!action) return "Activity";
    if (action.includes("_"))
      return action
        .split("_")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
    return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  };

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
        {activeTab === "Documents" && (
          <DocumentsTab
            docsData={docsData}
            docFilter={docFilter}
            setDocFilter={setDocFilter}
            empData={empData}
          />
        )}
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
              Update Shift - {selectedDayName}
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
                      (t) => t.day === selectedDayName,
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
          setSelectedDates([]);
        }}
        updateStatusValue={updateStatusValue}
        setUpdateStatusValue={setUpdateStatusValue}
      />
      <UpdateShiftTimeModal
        isOpen={showUpdateShiftTimeModal}
        onClose={() => setShowUpdateShiftTimeModal(false)}
        onSubmit={() => {
          setShowUpdateShiftTimeModal(false);
          setSelectedDates([]);
        }}
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        updateReason={updateReason}
        setUpdateReason={setUpdateReason}
      />
    </div>
  );
}
