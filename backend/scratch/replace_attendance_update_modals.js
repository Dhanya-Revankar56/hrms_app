const fs = require("fs");
const path = require("path");

const file =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";
let src = fs.readFileSync(file, "utf8");

// 1. Add imports
if (!src.includes("import UpdateAttendanceStatusModal")) {
  src = src.replace(
    "import AttendanceDetailsModal",
    'import AttendanceDetailsModal from "./modals/AttendanceDetailsModal";\nimport UpdateAttendanceStatusModal from "./modals/UpdateAttendanceStatusModal";\nimport UpdateShiftTimeModal from "./modals/UpdateShiftTimeModal";',
  );
}

// 2. Replace showUpdateStatusModal block
const startStatus = src.indexOf("{showUpdateStatusModal && (");
if (startStatus !== -1) {
  let openCount = 0;
  let endStatus = -1;
  for (let i = startStatus; i < src.length; i++) {
    if (src[i] === "{") openCount++;
    else if (src[i] === "}") {
      openCount--;
      if (openCount === 0) {
        endStatus = i + 1;
        break;
      }
    }
  }
  if (endStatus !== -1) {
    const replacement = `      <UpdateAttendanceStatusModal
        isOpen={showUpdateStatusModal}
        onClose={() => setShowUpdateStatusModal(false)}
        onSubmit={() => {
          setShowUpdateStatusModal(false);
          setSelectedDates([]);
        }}
        updateStatusValue={updateStatusValue}
        setUpdateStatusValue={setUpdateStatusValue}
      />`;
    src =
      src.substring(0, startStatus) + replacement + src.substring(endStatus);
    console.log("Replaced showUpdateStatusModal");
  }
}

// 3. Replace showUpdateShiftTimeModal block
const startShift = src.indexOf("{showUpdateShiftTimeModal && (");
if (startShift !== -1) {
  let openCount = 0;
  let endShift = -1;
  for (let i = startShift; i < src.length; i++) {
    if (src[i] === "{") openCount++;
    else if (src[i] === "}") {
      openCount--;
      if (openCount === 0) {
        endShift = i + 1;
        break;
      }
    }
  }
  if (endShift !== -1) {
    const replacement = `      <UpdateShiftTimeModal
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
      />`;
    src = src.substring(0, startShift) + replacement + src.substring(endShift);
    console.log("Replaced showUpdateShiftTimeModal");
  }
}

fs.writeFileSync(file, src);
console.log("Done!");
