const fs = require("fs");
const path = require("path");

const file =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";
let src = fs.readFileSync(file, "utf8");

// 1. Restore ApplyMovementModal import if missing
if (!src.includes("import ApplyMovementModal")) {
  src = src.replace(
    "import ApplyLeaveModal",
    'import ApplyMovementModal from "./modals/ApplyMovementModal";\nimport ApplyLeaveModal',
  );
}

// 2. Replace showAttSettingsModal block
const startSettings = src.indexOf("{showAttSettingsModal && (");
if (startSettings !== -1) {
  let openCount = 0;
  let endSettings = -1;
  for (let i = startSettings; i < src.length; i++) {
    if (src[i] === "{") openCount++;
    else if (src[i] === "}") {
      openCount--;
      if (openCount === 0) {
        endSettings = i + 1;
        break;
      }
    }
  }
  if (endSettings !== -1) {
    const replacement = `      <AttendanceSettingsModal
        isOpen={showAttSettingsModal}
        onClose={() => setShowAttSettingsModal(false)}
        biometricId={biometricId}
        setBiometricId={setBiometricId}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
      />`;
    src =
      src.substring(0, startSettings) +
      replacement +
      src.substring(endSettings);
    console.log("Replaced showAttSettingsModal");
  }
}

// 3. Replace showAttendanceDetailsModal block
const startDetails = src.indexOf("{showAttendanceDetailsModal && (");
if (startDetails !== -1) {
  let openCount = 0;
  let endDetails = -1;
  for (let i = startDetails; i < src.length; i++) {
    if (src[i] === "{") openCount++;
    else if (src[i] === "}") {
      openCount--;
      if (openCount === 0) {
        endDetails = i + 1;
        break;
      }
    }
  }
  if (endDetails !== -1) {
    const replacement = `      <AttendanceDetailsModal
        isOpen={showAttendanceDetailsModal}
        onClose={() => setShowAttendanceDetailsModal(false)}
        selectedDetailsDate={selectedDetailsDate}
        formatDateForDisplay={formatDateForDisplay}
      />`;
    src =
      src.substring(0, startDetails) + replacement + src.substring(endDetails);
    console.log("Replaced showAttendanceDetailsModal");
  }
}

fs.writeFileSync(file, src);
console.log("Done!");
