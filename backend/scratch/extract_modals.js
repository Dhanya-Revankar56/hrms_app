const fs = require("fs");
const path = require("path");

const tabsDir =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/components/tabs";
const modalsDir =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/components/modals";
const indexFile =
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail/index.tsx";

// Ensure modals directory exists
if (!fs.existsSync(modalsDir)) {
  fs.mkdirSync(modalsDir, { recursive: true });
}

// ----------------------------------------------------
// Step 1: Extract ApplyMovementModal from index.tsx
// ----------------------------------------------------
let indexSrc = fs.readFileSync(indexFile, "utf8");

const movementModalStart = "{showMovementModal && (";
const movementModalEnd = "setMStatus(null);\n"; // We will hoist the click logic out to handleApplyMovement

let startIdx = indexSrc.indexOf(movementModalStart);
let endIdx = indexSrc.indexOf(
  "</div>\n          </div>\n        </div>\n      )}",
  startIdx,
);
if (endIdx !== -1) {
  endIdx += "</div>\n          </div>\n        </div>\n      )}".length;
}

if (startIdx !== -1 && endIdx !== -1) {
  let movementModalRaw = indexSrc.substring(startIdx, endIdx);

  // We need to hoist the `onClick={async () => { ... }}` out of the "Submit" button
  let btnRegex =
    /onClick={async \(\) => {([\s\S]*?)}}\s*>\s*Apply Movement\s*<\/button>/;
  let match = movementModalRaw.match(btnRegex);
  if (match) {
    let hoistLogic = match[1];

    let handlerFunc = `\n  const handleApplyMovement = async () => {${hoistLogic}};\n`;
    // Insert handler before 'return ('
    indexSrc = indexSrc.replace("return (", handlerFunc + "\n  return (");

    // Clean up the modal itself to take props
    let cleanModalJSX = movementModalRaw
      .replace("{showMovementModal && (", "")
      .replace(/}\)$/, "")
      .replace(
        btnRegex,
        "onClick={onSubmit}>\n                Apply Movement\n              </button>",
      )
      .replace(/setShowMovementModal\(false\)/g, "onClose()")
      .replace(/moveForm\./g, "data.")
      .replace(/setMoveForm\(/g, "onChange("); // rough mapping

    let modalComponentCode = `/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import AnalogTimePicker from "../../components/AnalogTimePicker";

export default function ApplyMovementModal({ isOpen, onClose, onSubmit, data, onChange, mStatus, showOut, setShowOut, showRet, setShowRet, to12, tdiff }: any) {
  if (!isOpen) return null;
  return (
    <>
${cleanModalJSX
  .split("\n")
  .map((l) => "      " + l)
  .join("\n")}
    </>
  );
}
`;
    fs.writeFileSync(
      path.join(modalsDir, "ApplyMovementModal.tsx"),
      modalComponentCode,
    );

    // Replace modal in index.tsx
    indexSrc = indexSrc.replace(
      movementModalRaw,
      `<ApplyMovementModal 
        isOpen={showMovementModal} 
        onClose={() => setShowMovementModal(false)}
        onSubmit={handleApplyMovement}
        data={moveForm}
        onChange={setMoveForm}
        mStatus={mStatus}
        showOut={showOut}
        setShowOut={setShowOut}
        showRet={showRet}
        setShowRet={setShowRet}
        to12={to12}
        tdiff={tdiff}
      />`,
    );
    console.log("Extracted ApplyMovementModal");
  } else {
    console.log("Could not find button regex for ApplyMovement");
  }
} else {
  console.log("Could not find bounds for ApplyMovementModal in index.tsx");
}

// ----------------------------------------------------
// Step 2: Extract ApplyLeaveModal from LeavesTab.tsx
// ----------------------------------------------------
const leavesFile = path.join(tabsDir, "LeavesTab.tsx");
let leavesSrc = fs.readFileSync(leavesFile, "utf8");

const leaveModalStart = "{showApplyModal && (";

let lStartIdx = leavesSrc.indexOf(leaveModalStart);
let lEndIdx = leavesSrc.indexOf(
  "</div>\n                      </div>\n                    </div>\n                  )}",
  lStartIdx,
);
if (lEndIdx !== -1) {
  lEndIdx +=
    "</div>\n                      </div>\n                    </div>\n                  )}"
      .length;
}

if (lStartIdx !== -1 && lEndIdx !== -1) {
  let leaveModalRaw = leavesSrc.substring(lStartIdx, lEndIdx);

  // Attempt to extract the submit logic
  // The button says "Submit Application"
  let lBtnRegex =
    /onClick={async \(\) => {([\s\S]*?)}}\s*>\s*Submit Application\s*<\/button>/;
  let lMatch = leaveModalRaw.match(lBtnRegex);
  if (lMatch) {
    let lHoistLogic = lMatch[1];

    // Inject handler into index.tsx
    let lHandlerFunc = `\n  const handleApplyLeave = async () => {${lHoistLogic}};\n`;
    indexSrc = indexSrc.replace("return (", lHandlerFunc + "\n  return (");

    // Clean Modal JSX
    let cleanLeaveJSX = leaveModalRaw
      .replace("{showApplyModal && (", "")
      .replace(/}\)$/, "")
      .replace(
        lBtnRegex,
        "onClick={onSubmit}>\n                            Submit Application\n                          </button>",
      )
      .replace(/setShowApplyModal\(false\)/g, "onClose()")
      .replace(/applyForm\./g, "data.")
      .replace(/setApplyForm/g, "onChange"); // rough map

    let leaveComponentCode = `/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export default function ApplyLeaveModal({ isOpen, onClose, onSubmit, data, onChange, status, applyDaysData, applyTotalDays, leaveTypes }: any) {
  if (!isOpen) return null;
  return (
    <>
${cleanLeaveJSX
  .split("\n")
  .map((l) => "      " + l)
  .join("\n")}
    </>
  );
}
`;
    fs.writeFileSync(
      path.join(modalsDir, "ApplyLeaveModal.tsx"),
      leaveComponentCode,
    );

    // Remove from LeavesTab.tsx
    leavesSrc = leavesSrc.replace(leaveModalRaw, "");
    fs.writeFileSync(leavesFile, leavesSrc);

    // Inject ApplyLeaveModal to index.tsx right next to ApplyMovementModal
    // Wait, the user wants it at root level (outside tab conditions).
    let injectStr = `
      <ApplyLeaveModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplyLeave}
        data={applyForm}
        onChange={setApplyForm}
        status={status}
        applyDaysData={applyDaysData}
        applyTotalDays={applyTotalDays}
        leaveTypes={leaveTypes}
      />
      `;
    // Put it under ApplyMovementModal in index
    indexSrc = indexSrc.replace(
      "<ApplyMovementModal",
      injectStr + "\n      <ApplyMovementModal",
    );

    // Add imports on top
    indexSrc = indexSrc.replace(
      "import LeavesTab from",
      'import ApplyMovementModal from "./components/modals/ApplyMovementModal";\nimport ApplyLeaveModal from "./components/modals/ApplyLeaveModal";\nimport LeavesTab from',
    );

    console.log("Extracted ApplyLeaveModal");
  } else {
    console.log("Could not find button regex in LeavesTab");
  }
} else {
  console.log("Could not find bounds for ApplyLeaveModal in LeavesTab.tsx");
}

fs.writeFileSync(indexFile, indexSrc);
console.log("Modals successfully extracted to /modals");
