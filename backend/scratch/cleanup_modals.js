const fs = require("fs");

// 1. Remove old commented-out modal block from index.tsx
const idxFile =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";
let idxSrc = fs.readFileSync(idxFile, "utf8");

const commentStart =
  "      {/* ApplyMovementModal original block removed - rendered above as component */\n      /*";
const commentEnd = "      */ }";

const si = idxSrc.indexOf(commentStart);
const ei = idxSrc.indexOf(commentEnd, si);

if (si !== -1 && ei !== -1) {
  idxSrc = idxSrc.substring(0, si) + idxSrc.substring(ei + commentEnd.length);
  console.log("Removed commented block from index.tsx");
} else {
  console.log("WARN: Could not find comment block, si:", si, "ei:", ei);
}

fs.writeFileSync(idxFile, idxSrc);

// 2. Remove showApplyModal block from LeavesTab.tsx (lines 290-647)
const leavesFile =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/components/tabs/LeavesTab.tsx";
let leavesSrc = fs.readFileSync(leavesFile, "utf8");

const modalStart = "\r\n                  {showApplyModal && (";
const modalEnd = "                  )}\r\n                </div>";

const lsi = leavesSrc.indexOf(modalStart);
const lei = leavesSrc.indexOf(modalEnd, lsi);

if (lsi !== -1 && lei !== -1) {
  // Remove modalStart through end of modalEnd
  leavesSrc =
    leavesSrc.substring(0, lsi) +
    "\r\n                </div>" +
    leavesSrc.substring(lei + modalEnd.length);
  console.log("Removed modal block from LeavesTab.tsx");
} else {
  console.log(
    "WARN: Could not find modal block in LeavesTab, lsi:",
    lsi,
    "lei:",
    lei,
  );
}

// Also remove now-unused props from LeavesTab signature
leavesSrc = leavesSrc.replace(
  "export default function LeavesTab({ leavesData, setShowApplyModal, showApplyModal, setApplyForm, applyForm, applyDaysData, applyTotalDays, status, setStatus, applyLeave }: any)",
  "export default function LeavesTab({ leavesData, setShowApplyModal }: any)",
);

fs.writeFileSync(leavesFile, leavesSrc);
console.log("LeavesTab cleaned up.");
