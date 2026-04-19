const fs = require("fs");
const path = require("path");

const srcFile = path.resolve(
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail.tsx",
);
let originalLines = fs.readFileSync(srcFile, "utf8").split("\n");

const createDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const outDir = path.resolve(
  "c:/projects/hrms_app/frontend/hrms-frontend/src/pages/EmployeeDetail",
);
const tabsDir = path.join(outDir, "components", "tabs");
const modalsDir = path.join(outDir, "components", "modals");

createDir(tabsDir);
createDir(modalsDir);

const bounds = [
  {
    name: "SummaryTab",
    startMark: '{activeTab === "Summary" && (',
    propFields: ["empData", "formatDateForDisplay"],
  },
  {
    name: "SalaryTab",
    startMark: '{activeTab === "Salary Details" && (',
    propFields: ["salaryData", "empData"],
  },
  {
    name: "AttendanceTab",
    startMark: '{activeTab === "Attendance" && (',
    propFields: [
      "attendanceData",
      "monthYear",
      "setMonthYear",
      "setShowAttSettingsModal",
      "setShowUpdateStatusModal",
      "setShowAttendanceDetailsModal",
    ],
  },
  {
    name: "MovementsTab",
    startMark: '{activeTab === "Movements" && (',
    propFields: ["movementsData", "setShowMovementModal"],
  },
  {
    name: "LeavesTab",
    startMark: '{activeTab === "Leaves" && (',
    propFields: [
      "leavesData",
      "setShowApplyModal",
      "showApplyModal",
      "setApplyForm",
      "applyForm",
      "applyDaysData",
      "applyTotalDays",
      "status",
      "setStatus",
      "applyLeave",
    ],
  },
  {
    name: "DocumentsTab",
    startMark: '{activeTab === "Documents" && (',
    propFields: ["docsData", "docFilter", "setDocFilter", "empData"],
  },
  {
    name: "PayslipsTab",
    startMark: '{activeTab === "Payslips" && (',
    propFields: [],
  },
  {
    name: "EventRegisterTab",
    startMark: '{activeTab === "Event Register" && (',
    propFields: [
      "lifecycleLogs",
      "lcFilterFrom",
      "lcFilterTo",
      "setLcFilterFrom",
      "setLcFilterTo",
      "exportLifecycleCsv",
      "lifecycleLoading",
    ],
  },
];

let currentIndex = 0;
while (
  currentIndex < originalLines.length &&
  !originalLines[currentIndex].includes('{activeTab === "Summary" && (')
) {
  currentIndex++;
}

const startRows = [];
bounds.forEach((b) => {
  let i = currentIndex;
  while (i < originalLines.length) {
    if (originalLines[i].includes(b.startMark)) {
      startRows.push(i);
      break;
    }
    i++;
  }
});

// Find where the tabs actually end -> where the showMovementModal begins
let endTabsRow = startRows[startRows.length - 1];
while (
  endTabsRow < originalLines.length &&
  !originalLines[endTabsRow].includes("{showMovementModal && (")
) {
  endTabsRow++;
}

const chunks = [];
for (let i = 0; i < bounds.length; i++) {
  const start = startRows[i];
  let end = i < bounds.length - 1 ? startRows[i + 1] : endTabsRow;

  let content = originalLines.slice(start + 1, end).join("\n");
  let lastParenObj = content.lastIndexOf(")}");
  if (lastParenObj !== -1) {
    content = content.substring(0, lastParenObj);
  }

  chunks.push({
    name: bounds[i].name,
    props: bounds[i].propFields,
    content: content.trim(),
  });
}

const formatProps = (props) => {
  if (!props || props.length === 0) return `{}: any`;
  return `{ ${props.join(", ")} }: any`;
};

chunks.forEach((c) => {
  const fileContent = `/* eslint-disable @typescript-eslint/no-explicit-any */\n/* eslint-disable @typescript-eslint/no-unused-vars */\n/* eslint-disable no-empty-pattern */\nexport default function ${c.name}(${formatProps(c.props)}) {
  return (
    <>
${c.content
  .split("\n")
  .map((l) => "      " + l)
  .join("\n")}
    </>
  );
}
`;
  fs.writeFileSync(path.join(tabsDir, c.name + ".tsx"), fileContent);
  console.log(`Created ${c.name}.tsx`);
});

// Construct new Main Lines
let newMainLines = originalLines.slice(0, startRows[0]);
chunks.forEach((c) => {
  newMainLines.push(
    `        {activeTab === "${c.name.replace("Tab", "")}" && <${c.name} ${c.props.map((p) => p + "={" + p + "}").join(" ")} />}`,
  );
});

const imports = chunks
  .map((c) => `import ${c.name} from "./components/tabs/${c.name}";`)
  .join("\n");

// We have stripped the final `</div>` enclosing `ed-content`.
// endTabsRow points to `{showMovementModal && (`. We need to close the div!
let remainderLines = originalLines.slice(endTabsRow).join("\n");
let modifiedMain =
  newMainLines.join("\n") + "\n      </div>\n\n" + remainderLines;

let linesArr = modifiedMain.split("\n");
let importIndex = 0;
for (let i = 0; i < linesArr.length; i++) {
  if (linesArr[i].includes("import ") && linesArr[i].includes("from")) {
    importIndex = i;
  }
}
linesArr.splice(importIndex + 1, 0, imports);

fs.writeFileSync(path.join(outDir, "index.tsx"), linesArr.join("\n"));
console.log("Created index.tsx");
