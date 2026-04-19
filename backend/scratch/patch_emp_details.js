const fs = require("fs");
const path = require("path");

const tabsDir =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/components/tabs";
const indexFile =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";

// 1. Fix Index.tsx
let idxSrc = fs.readFileSync(indexFile, "utf8");
idxSrc = idxSrc.replace(
  'activeTab === "Salary"',
  'activeTab === "Salary Details"',
);
idxSrc = idxSrc.replace(
  'activeTab === "EventRegister"',
  'activeTab === "Event Register"',
);
if (!idxSrc.includes("const [docFilter, setDocFilter]")) {
  idxSrc = idxSrc.replace(
    "const navigate = useNavigate();",
    'const navigate = useNavigate();\n  const [docFilter, setDocFilter] = useState("All");',
  );
}
fs.writeFileSync(indexFile, idxSrc);

// 2. Fix SummaryTab
const sumFile = path.join(tabsDir, "SummaryTab.tsx");
let sumSrc = fs.readFileSync(sumFile, "utf8");
const sumInject = `
  const employee = empData?.employee;
  const initials = employee ? \`\${employee.first_name?.[0] || ""}\${employee.last_name?.[0] || ""}\`.toUpperCase() : "";
`;
sumSrc = sumSrc.replace("return (", sumInject + "  return (");
fs.writeFileSync(sumFile, sumSrc);

// 3. Fix SalaryTab
const salFile = path.join(tabsDir, "SalaryTab.tsx");
let salSrc = fs.readFileSync(salFile, "utf8");
const salInject = `
  const employee = empData?.employee;
  const salary = salaryData?.salaryRecord;
`;
salSrc = salSrc.replace("return (", salInject + "  return (");
fs.writeFileSync(salFile, salSrc);

// 4. Fix LeavesTab
const leaFile = path.join(tabsDir, "LeavesTab.tsx");
let leaSrc = fs.readFileSync(leaFile, "utf8");
// remove them from index to prevent duplicate or just redefine
const leaInject = `
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
    const names: Record<string, string> = { CL: "Casual Leave", OOD: "On Official Duty", SL: "Sick Leave", PL: "Paid Leave", ML: "Maternity Leave", Pat_L: "Paternity Leave" };
    return names[code] || type;
  };
  const getLeaveMeta = (code: string) => {
    const meta: Record<string, { bg: string; color: string }> = {
      CL: { bg: "#eff6ff", color: "#1d4ed8" }, OOD: { bg: "#f0fdff", color: "#0891b2" },
      SL: { bg: "#fffbeb", color: "#b45309" }, PL: { bg: "#f0fdf4", color: "#15803d" },
      ML: { bg: "#fdf2f8", color: "#db2777" }, Pat_L: { bg: "#f5f3ff", color: "#7c3aed" },
      Other: { bg: "#f8fafc", color: "#64748b" },
    };
    return meta[code] || meta["Other"];
  };
  const getUsedCount = (typeName: string, leaves: any[] = []) => {
    const targetCode = getLeaveCode(typeName);
    return leaves
      .filter((l) => getLeaveCode(l.leave_type) === targetCode && (l.status || "").toLowerCase() === "approved")
      .reduce((sum: number, l) => sum + (l.total_days || 0), 0);
  };
  const leaveTypes = leavesData?.leaves?.items ? Array.from(new Set(leavesData.leaves.items.map((l:any)=>l.leave_type))).map((n:any)=>({name:n})) : [];
`;
leaSrc = leaSrc.replace("return (", leaInject + "  return (");
fs.writeFileSync(leaFile, leaSrc);

// 5. Fix EventRegisterTab
const evFile = path.join(tabsDir, "EventRegisterTab.tsx");
let evSrc = fs.readFileSync(evFile, "utf8");
const evInject = `
const MODULE_MAP: Record<string, string> = {
  employee: "Employee Management", onboarding: "Employee Onboarding",
  leave: "Leave Management", attendance: "Attendance",
  movement: "Movement Register", relieving: "Relieving",
  settings: "Settings", holiday: "Holidays",
};
const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return { date: "Invalid", time: "" };
  return { date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", }), time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, }), };
};
const formatAction = (action: string) => {
  if (!action) return "Activity";
  if (action.includes("_")) return action.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
};
`;
// Insert outside the function if possible to avoid recreating, or inside. Outside is fine.
evSrc = evSrc.replace(
  "export default function EventRegisterTab",
  evInject + "\nexport default function EventRegisterTab",
);
fs.writeFileSync(evFile, evSrc);

// 6. Fix AttendanceTab
const attFile = path.join(tabsDir, "AttendanceTab.tsx");
let attSrc = fs.readFileSync(attFile, "utf8");
const attInject = `
  const to12 = (t: string): string => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return \`\${h % 12 || 12}:\${String(m).padStart(2, "0")} \${ap}\`;
  };
  const tdiff = (a: string, b: string): string => {
    if (!a || !b) return "—";
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const d = bh * 60 + bm - (ah * 60 + am);
    if (d <= 0) return "—";
    return Math.floor(d / 60) > 0 ? \`\${Math.floor(d / 60)}h \${d % 60}m\` : \`\${d}m\`;
  };
  const [selectedDates, setSelectedDates] = require('react').useState([]);
  const [updateStatusValue, setUpdateStatusValue] = require('react').useState("");
`;
attSrc = attSrc.replace("return (", attInject + "  return (");
fs.writeFileSync(attFile, attSrc);

console.log("All missing dependencies injected!");
