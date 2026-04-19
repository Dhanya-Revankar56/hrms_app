const fs = require("fs");

const file =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";
let src = fs.readFileSync(file, "utf8");

// Insert the two handlers before "if (empLoading)"
const insertBefore = "  if (empLoading) return";

const handlers = `
  const handleApplyMovement = async () => {
    setMStatus(null);
    if (!moveForm.movement_date) { setMStatus({ message: "Please select a date.", type: "error" }); return; }
    const sd = new Date(moveForm.movement_date);
    if (sd.getDay() === 0) { setMStatus({ message: "Movements cannot be applied on Sundays.", type: "error" }); return; }
    if (!moveForm.out_time || !moveForm.in_time || !moveForm.purpose.trim()) { setMStatus({ message: "Please fill all required fields.", type: "error" }); return; }
    const [outH, outM] = moveForm.out_time.split(":").map(Number);
    const [inH, inM] = moveForm.in_time.split(":").map(Number);
    const nStart = outH * 60 + outM;
    const nEnd = inH * 60 + inM;
    if (nEnd <= nStart) { setMStatus({ message: "Return time must be after out time.", type: "error" }); return; }
    const existMv = movementsData?.movements?.items || [];
    const mvOverlap = existMv.some((m: any) => {
      const s = (m.status || "").toLowerCase();
      if (s === "rejected" || s === "cancelled") return false;
      if (m.movement_date.split("T")[0] !== moveForm.movement_date) return false;
      const [exOH, exOM] = m.out_time.split(":").map(Number);
      const [exIH, exIM] = (m.in_time || "23:59").split(":").map(Number);
      return nStart < (exIH * 60 + exIM) && nEnd > (exOH * 60 + exOM);
    });
    if (mvOverlap) { setMStatus({ message: "You already have a movement scheduled during this time.", type: "error" }); return; }
    try {
      await applyMovement({ variables: { input: { employee_id: id || "", employee_code: employee?.employee_id || "", movement_date: moveForm.movement_date, movement_type: moveForm.movement_type, out_time: moveForm.out_time, in_time: moveForm.in_time || null, purpose: moveForm.purpose, remarks: moveForm.remarks } } });
      setMStatus({ message: "Movement applied successfully!", type: "success" });
      setTimeout(() => { setShowMovementModal(false); setMStatus(null); setMoveForm({ movement_date: new Date().toISOString().split("T")[0], movement_type: "official", out_time: "09:00", in_time: "10:00", purpose: "", remarks: "" }); }, 1500);
    } catch (err: unknown) { const error = err as { message?: string }; setMStatus({ message: error.message || "Error applying", type: "error" }); }
  };

  const handleApplyLeave = async () => {
    setStatus(null);
    const newFrom = applyForm.from_date;
    const newTo = applyForm.to_date;
    if (!newFrom || !newTo) { setStatus({ message: "Please select dates.", type: "error" }); return; }
    const lStart = new Date(newFrom);
    const lEnd = new Date(newTo);
    if (lEnd < lStart) { setStatus({ message: "To Date cannot be before From Date.", type: "error" }); return; }
    const existingLeaves = leavesData?.leaves?.items || [];
    const leaveOverlap = existingLeaves.some((l: any) => {
      const s = (l.status || "").toLowerCase();
      if (s === "rejected" || s === "cancelled") return false;
      return lStart <= new Date(l.to_date) && lEnd >= new Date(l.from_date);
    });
    if (leaveOverlap) { setStatus({ message: "You have already applied for leave during this period.", type: "error" }); return; }
    const day_breakdowns = applyDaysData.map((d: any) => ({ date: d.date, leave_type: d.type }));
    try {
      await applyLeave({ variables: { input: { leave_type: applyForm.leave_type, from_date: newFrom, to_date: newTo, reason: applyForm.reason, employee_id: id || "", day_breakdowns } } });
      setStatus({ message: "Leave applied successfully!", type: "success" });
      setTimeout(() => { setShowApplyModal(false); setStatus(null); setApplyForm({ leave_type: leaveTypes[0]?.name || "", from_date: "", to_date: "", reason: "" }); setApplyDaysData([]); }, 1500);
    } catch (err: unknown) { const error = err as { message?: string }; setStatus({ message: error.message || "Error applying", type: "error" }); }
  };

`;

src = src.replace(insertBefore, handlers + insertBefore);
fs.writeFileSync(file, src);
console.log("Handlers injected!");
