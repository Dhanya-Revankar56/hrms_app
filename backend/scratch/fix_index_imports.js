const fs = require("fs");

const file =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";
let src = fs.readFileSync(file, "utf8");

const start = src.indexOf("import ApplyMovementModal");
const end = src.indexOf("const CSS =");

if (start !== -1 && end !== -1) {
  const replacement = `import ApplyMovementModal from "./components/modals/ApplyMovementModal";
import ApplyLeaveModal from "./components/modals/ApplyLeaveModal";
import AttendanceSettingsModal from "./components/modals/AttendanceSettingsModal";
import AttendanceDetailsModal from "./components/modals/AttendanceDetailsModal";
import UpdateAttendanceStatusModal from "./components/modals/UpdateAttendanceStatusModal";
import UpdateShiftTimeModal from "./components/modals/UpdateShiftTimeModal";

`;
  src = src.substring(0, start) + replacement + src.substring(end);
  fs.writeFileSync(file, src);
  console.log("Cleaned up imports successfully");
} else {
  console.log("Could not find the range to replace");
}
