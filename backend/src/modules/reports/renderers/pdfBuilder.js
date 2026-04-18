const puppeteer = require("puppeteer-core");
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const Settings = require("../../settings/model");
const Employee = require("../../employee/model");
const Department = require("../../settings/department.model");

// 🌐 Cloud Dependencies (Conditional for serverless environments)
let chromium;
try {
  if (process.env.NODE_ENV === "production") {
    chromium = require("@sparticuz/chromium");
  }
} catch (e) {
  console.warn(
    "[PDFBuilder] @sparticuz/chromium not found, falling back to local Chrome",
  );
}

/**
 * 🖨 PDF BUILDER
 * Converts normalized report rows + report config into a styled PDF
 * using Handlebars HTML templates and Puppeteer (puppeteer-core + system Chrome).
 *
 * Flow:
 *   1. Resolve Handlebars template (report-specific or base-report.hbs fallback)
 *   2. Fetch tenant metadata (institution name, code) for the letterhead
 *   3. Compile template with data → HTML string
 *   4. Launch Puppeteer pointed at system Chrome
 *   5. Render HTML → PDF buffer → stream to Express response
 */

// ─── Chrome Executable Path ───────────────────────────────────────────────────
// Ordered list of common Chrome locations on Windows/Mac/Linux.
// The first path that exists wins.
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.CHROME_PATH || "", // Allow override via .env
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const findChrome = () => {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error(
    "[PDFBuilder] Chrome not found. Set CHROME_PATH in .env or install Google Chrome.",
  );
};

// ─── Handlebars Helpers ───────────────────────────────────────────────────────

// Prevent duplicate registration on hot reloads (nodemon)
if (!Handlebars.helpers["today"]) {
  Handlebars.registerHelper("today", () =>
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  );
}

if (!Handlebars.helpers["rowIndex"]) {
  Handlebars.registerHelper("rowIndex", (index) => index + 1);
}

if (!Handlebars.helpers["str"]) {
  Handlebars.registerHelper("str", (val) =>
    val !== null && val !== undefined ? String(val) : "N/A",
  );
}

if (!Handlebars.helpers["eq"]) {
  Handlebars.registerHelper("eq", (a, b) => a === b);
}

if (!Handlebars.helpers["gt"]) {
  Handlebars.registerHelper("gt", (a, b) => a > b);
}

// ─── Template Resolution ──────────────────────────────────────────────────────

const TEMPLATES_DIR = path.join(__dirname, "../templates");

// Cache compiled templates in memory (avoid reading disk on every request)
// const templateCache = {}; // Removed to satisfy ESLint as it was unused

/**
 * Load and compile a Handlebars template.
 * Falls back to base-report.hbs if the specific template doesn't exist.
 * NOTE: Cache is disabled so template file changes are always picked up.
 */
const loadTemplate = (templateName) => {
  const key = templateName || "base-report";
  const specific = path.join(TEMPLATES_DIR, `${key}.hbs`);
  const base = path.join(TEMPLATES_DIR, "base-report.hbs");
  const filePath = fs.existsSync(specific) ? specific : base;

  const source = fs.readFileSync(filePath, "utf8");
  return Handlebars.compile(source);
};

// ─── Institution Info ─────────────────────────────────────────────────────────

/**
 * Fetch institution metadata for the PDF letterhead.
 * Reads from the Settings model (configured in the admin Settings page).
 * Falls back to safe defaults if no settings exist yet.
 *
 * Returns a plain object consumed by all Handlebars templates.
 */
const getInstitutionInfo = async (tenantId) => {
  const defaults = {
    name: "Institution",
    shortName: "",
    code: "HRMS",
    logo: null, // base64 data URI or null
    address: "",
    city: "",
    state: "",
    pinCode: "",
    email: "",
    phone: "",
    website: "",
  };

  try {
    if (!tenantId) return defaults;

    console.log(`[PDFBuilder] Fetching settings for tenant: ${tenantId}`);

    // Add a quick timeout for settings lookup to prevent hanging on flaky networks
    // 🎯 Optimization: Add a strict timeout for settings lookup to prevent hanging the whole PDF
    const settings = await Settings.findOne({ tenant_id: tenantId })
      .setOptions({ skipTenant: true, serverSelectionTimeoutMS: 5000 })
      .lean();

    if (!settings) {
      console.warn("[PDFBuilder] Settings not found, using defaults");
      return defaults;
    }

    // Build a single-line address string for the letterhead footer
    const addrParts = [
      settings.address?.line1,
      settings.address?.line2,
      settings.address?.city,
      settings.address?.state,
      settings.address?.pin_code,
    ].filter(Boolean);

    // If a logo path/URL is stored, try to read it as a base64 data URI
    // so Puppeteer can embed it without needing network access.
    let logoDataUri = null;
    if (settings.institution_logo) {
      const logoVal = settings.institution_logo;
      if (logoVal.startsWith("data:")) {
        // Already a data URI (e.g. stored as base64 in DB)
        logoDataUri = logoVal;
      } else if (logoVal.startsWith("http")) {
        // Remote URL — pass through and let Puppeteer fetch it
        logoDataUri = logoVal;
      } else {
        // Local file path — try to read and encode
        try {
          const logoPath = path.resolve(logoVal);
          if (fs.existsSync(logoPath)) {
            const ext = path.extname(logoPath).replace(".", "") || "png";
            const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
            const b64 = fs.readFileSync(logoPath).toString("base64");
            logoDataUri = `data:${mime};base64,${b64}`;
          }
        } catch (_) {
          /* ignore, fall back to initials placeholder */
        }
      }
    }

    return {
      name: settings.institution_name || defaults.name,
      shortName: settings.institution_short_name || "",
      code: settings.institution_code || defaults.code,
      logo: logoDataUri,
      address: addrParts.join(", "),
      city: settings.address?.city || "",
      state: settings.address?.state || "",
      pinCode: settings.address?.pin_code || "",
      email: settings.contact_email || "",
      phone: settings.contact_mobile || settings.contact_phone || "",
      website: settings.website_url || "",
    };
  } catch (err) {
    console.error(
      "[PDFBuilder] Failed to fetch institution settings:",
      err.message,
    );
    return defaults;
  }
};

// ─── Browser Singleton ────────────────────────────────────────────────────────

let browserInstance = null;

const getBrowserInstance = async () => {
  if (browserInstance) return browserInstance;

  console.log("[PDFBuilder] Launching Chromium...");
  const isProduction = process.env.NODE_ENV === "production";
  const launchOptions = {
    headless: isProduction ? chromium.headless : "new",
    args: isProduction
      ? chromium.args
      : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
    executablePath: isProduction
      ? await chromium.executablePath()
      : findChrome(),
  };

  browserInstance = await puppeteer.launch(launchOptions);
  console.log("[PDFBuilder] Browser launched successfully");
  return browserInstance;
};

// ─── Main PDF Generator ───────────────────────────────────────────────────────

/**
 * Generate a PDF and stream it directly to the Express response.
 *
 * @param {Object[]} rows     - Normalized flat row objects from normalizer
 * @param {string[]} columns  - Column header labels (from getColumns())
 * @param {Object}   config   - Report config from registry
 * @param {Object}   params   - req.query (for date range display)
 * @param {string}   tenantId - Current tenant ID (from req.user.tenant_id)
 * @param {Object}   res      - Express response object
 */
const generatePDF = async (
  rows,
  columns,
  config,
  params,
  tenantId,
  user,
  res,
) => {
  const startTotal = Date.now();
  console.log(`[PDFBuilder] Starting generation for: ${config.id || "report"}`);

  // 1. Institution info from Settings
  console.log("[PDFBuilder] Fetching institution metadata...");
  const institution = await getInstitutionInfo(tenantId).catch((err) => {
    console.warn(
      "[PDFBuilder] Metadata lookup failed, using fallbacks:",
      err.message,
    );
    return { name: "Institution", code: "HRMS" };
  });

  // 2. Data Grouping (Optional) — Restructure rows for segregated layouts
  console.log(`[PDFBuilder] Processing ${rows.length} rows...`);
  let displayData = rows;
  let isGrouped = false;

  if (config.groupBy) {
    isGrouped = true;
    const groups = {};

    // 🔍 Find the display label for the groupBy path in the fieldMap
    const groupLabel = config.fieldMap[config.groupBy] || config.groupBy;

    rows.forEach((row) => {
      // Since rows are already normalized, look up by the label
      const gValue = row[groupLabel] || "Uncategorized";
      if (!groups[gValue]) groups[gValue] = [];
      groups[gValue].push(row);
    });

    displayData = Object.keys(groups).map((key) => ({
      groupValue: key,
      rows: groups[key],
    }));
  }

  // ── 🎯 Applied Filters Summary (Optimized: Use labels from params if provided) ──
  const filterSummary = [];
  const deptId = params.departmentId;
  let deptName = params.deptName; // 🎯 Resolved label from frontend
  const categoryStr = params.category;
  const categoryLabel = params.categoryLabel; // 🎯 Resolved label from frontend
  const monthStr = params.month;
  const selectedDate = params.selectedDate;
  const leaveTypeStr = params.leaveType;
  const statusStr = params.status;

  // 🏛 Department Label
  if (deptName) {
    filterSummary.push({ key: "Department", value: deptName });
  } else if (deptId && deptId !== "All") {
    // Fallback to DB lookup if label missing (with timeout)
    try {
      const dept = await Department.findById(deptId)
        .setOptions({ skipTenant: true, serverSelectionTimeoutMS: 3000 })
        .lean();
      if (dept) filterSummary.push({ key: "Department", value: dept.name });
    } catch (_) {
      filterSummary.push({ key: "Department", value: "Selected Department" });
    }
  } else {
    filterSummary.push({ key: "Department", value: "All Departments" });
  }

  // 🏷 Category Label
  if (categoryLabel) {
    filterSummary.push({ key: "Employee Category", value: categoryLabel });
  } else if (categoryStr && categoryStr !== "All") {
    filterSummary.push({ key: "Employee Category", value: categoryStr });
  }

  if (monthStr) {
    const [y, m] = monthStr.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = d.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    filterSummary.push({ key: "Month", value: monthName });
  }

  if (selectedDate) {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      filterSummary.push({
        key: "Date",
        value: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      });
    }
  }

  if (leaveTypeStr && leaveTypeStr !== "All") {
    filterSummary.push({ key: "Leave Type", value: leaveTypeStr });
  }

  if (statusStr && statusStr !== "All") {
    filterSummary.push({
      key: "Leave Status",
      value: statusStr.charAt(0).toUpperCase() + statusStr.slice(1),
    });
  }

  // 🎯 Custom Addition: Signature Logic based on User who generated the report
  const User = require("../../auth/user.model");
  let leftName = "System Administrator";
  let leftTitle = "Admin";
  let leftSubtitle = "";

  let rightName = "Principal / Director";
  let rightSubtitle = institution.name || "";

  if (user) {
    if (user.role === "HEAD OF DEPARTMENT") {
      const hodEmp = await Employee.findOne({ user_id: user.id })
        .select("name work_detail")
        .populate("work_detail.department", "name")
        .setOptions({ skipTenant: true, serverSelectionTimeoutMS: 2000 })
        .lean()
        .catch(() => null);

      if (hodEmp) {
        leftName = hodEmp.name.toUpperCase();
        leftTitle = "Head of Department".toUpperCase();
        leftSubtitle = (
          hodEmp.work_detail?.department?.name || ""
        ).toUpperCase();
      } else {
        leftName = "HOD".toUpperCase();
        leftTitle = "Head of Department".toUpperCase();
      }
    } else if (
      user.role === "admin" ||
      user.role === "ADMIN" ||
      user.role === "superadmin" ||
      user.role === "SYSTEM ADMINISTRATOR"
    ) {
      const adminDoc = await User.findOne({ _id: user.id })
        .select("name")
        .setOptions({ skipTenant: true, serverSelectionTimeoutMS: 2000 })
        .lean()
        .catch(() => null);
      if (adminDoc && adminDoc.name) {
        leftName = adminDoc.name.toUpperCase();
      } else {
        leftName = "SYSTEM ADMINISTRATOR";
      }
      leftTitle = "Admin".toUpperCase();
    } else {
      leftTitle = (user.role || "Generated By").toUpperCase();
      const userEmp = await Employee.findOne({ user_id: user.id })
        .select("name")
        .setOptions({ skipTenant: true, serverSelectionTimeoutMS: 2000 })
        .lean()
        .catch(() => null);
      if (userEmp) {
        leftName = userEmp.name.toUpperCase();
      } else {
        leftName = "HR OFFICER";
      }
    }
  }

  const signatureInfo = {
    leftName: leftName.toUpperCase(),
    leftTitle: leftTitle.toUpperCase(),
    leftSubtitle: leftSubtitle.toUpperCase(),
    rightName: rightName.toUpperCase(),
    rightSubtitle: rightSubtitle.toUpperCase(),
  };

  // 3. Template context
  const templateData = {
    institution,
    reportTitle: config.label,
    reportCategory: (config.category || "report").toUpperCase(),
    generatedOn: new Date().toLocaleString("en-IN"),
    dateFrom: params.startDate || null,
    dateTo: params.endDate || null,
    columns,
    rows: displayData, // Restructured if isGrouped
    isGrouped,
    totalRecords: rows.length,
    hasRows: rows.length > 0,
    appliedFilters: filterSummary,
    signatureInfo,
    // Extract leave type columns for the dedicated leave-balance template
    leaveTypeColumns: columns.filter(
      (c) =>
        ![
          "Employee Name",
          "Employee ID",
          "Department",
          "Designation",
          "Total",
        ].includes(c),
    ),
  };

  // 4. Compile HTML from template
  const template = loadTemplate(config.template || "base-report");
  const htmlContent = template(templateData);

  // 4. Render PDF with Puppeteer
  let page;

  try {
    const browser = await getBrowserInstance();

    page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    const renderStart = Date.now();
    console.log("[PDFBuilder] Rendering HTML to PDF...");
    // 🚀 Speedup: Stop waiting for full network activity, render as soon as structure is ready
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

    // Inject print CSS to ensure colors render correctly in headless mode
    const cssPath = path.join(TEMPLATES_DIR, "assets", "report-styles.css");
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, "utf8");
      await page.addStyleTag({ content: css });
    }

    // Determine page orientation: use config flag or template name list
    const isLandscape =
      config.landscape === true ||
      ["attendance-report", "movement-report"].includes(config.template || "");

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: isLandscape,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "18mm",
        bottom: "18mm",
        left: isLandscape ? "12mm" : "15mm",
        right: isLandscape ? "12mm" : "15mm",
      },
    });

    console.log(
      `[PDFBuilder] Rendering step took ${Date.now() - renderStart}ms`,
    );
    console.log(
      `[PDFBuilder] Total generation time: ${Date.now() - startTotal}ms`,
    );

    // 5. Stream PDF response
    const filename = `${config.id || "report"}_${Date.now()}.pdf`;
    const isDownload = params.download === "pdf";
    const disposition = isDownload ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    console.error("[PDFBuilder] Chromium Error:", err.stack);
    throw new Error(`PDF Render Failed: ${err.message}`, { cause: err });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (_) {
        /* ignore close errors */
      }
    }
  }
};

module.exports = { generatePDF };
