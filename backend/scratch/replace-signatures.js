const fs = require("fs");
const path = require("path");
const templatesDir = path.join(
  "c:",
  "projects",
  "hrms_app",
  "backend",
  "src",
  "modules",
  "reports",
  "templates",
);
const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".hbs"));

const newFooterHtml = `  <!-- FOOTER -->
  <div class="report-footer" style="margin-top: 18px; border-top: 2px solid #0d6e4e; padding-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8px; color: #555;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
      <!-- Left Signature (HOD or Admin) -->
      <div class="signature-block" style="text-align: center; min-width: 130px;">
        <div class="signature-name" style="font-weight: 700; font-size: 10px; color: #000; margin-bottom: 3px;">{{ signatureInfo.leftName }}</div>
        <div class="signature-line" style="border-top: 1px solid #444; padding-top: 4px; font-size: 8px; font-weight: bold;">{{ signatureInfo.leftTitle }}</div>
        {{#if signatureInfo.leftSubtitle}}<div style="font-size: 8px; padding-top: 2px; font-weight: bold;">{{ signatureInfo.leftSubtitle }}</div>{{/if}}
      </div>
      
      <!-- Center Info -->
      <div class="footer-center" style="text-align: center; font-size: 7.5px; color: #888; flex: 1; padding: 0 10px;">
        {{ institution.name }}<br/><span style="color:#aaa;">System-generated &nbsp;|&nbsp; HRMS</span>
      </div>
      
      <!-- Right Signature (Principal) -->
      <div class="signature-block" style="text-align: center; min-width: 130px;">
        <div class="signature-name" style="font-weight: 700; font-size: 10px; color: #000; margin-bottom: 3px;">&nbsp;</div>
        <div class="signature-line" style="border-top: 1px solid #444; padding-top: 4px; font-size: 8px; font-weight: bold;">{{ signatureInfo.rightName }}</div>
        <div style="font-size: 8px; padding-top: 2px; font-weight: bold;">{{ signatureInfo.rightSubtitle }}</div>
      </div>
    </div>
  </div>`;

files.forEach((file) => {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes(newFooterHtml)) {
    return;
  }

  if (content.includes("<!-- FOOTER -->")) {
    content = content.replace(
      /<!-- FOOTER -->[\s\S]*?<\/body>/,
      newFooterHtml + "\n\n</body>",
    );
  } else if (content.includes("<!-- SIGNATURES -->")) {
    content = content.replace(
      /<!-- SIGNATURES -->[\s\S]*?<\/body>/,
      newFooterHtml + "\n\n</body>",
    );
  } else if (content.includes('<div class="report-footer">')) {
    content = content.replace(
      /<div class="report-footer">[\s\S]*?<\/body>/,
      newFooterHtml + "\n\n</body>",
    );
  } else if (content.includes('<div class="signature-container">')) {
    content = content.replace(
      /<div class="signature-container">[\s\S]*?<\/body>/,
      newFooterHtml + "\n\n</body>",
    );
  }

  fs.writeFileSync(filePath, content);
  console.log("Updated " + file);
});
