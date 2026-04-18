const { getConfig } = require("../registry");
const { buildQuery } = require("./queryEngine");
const { fetchData } = require("./fetcher");
const { normalizeData, getColumns } = require("./normalizer");
const { generatePDF } = require("../renderers/pdfBuilder");

/**
 * 🎯 REPORT ENGINE — Orchestrator
 *
 * The single entry point for all report requests.
 * Reads the report config, builds the query, fetches data,
 * normalizes it, then either returns JSON or generates a PDF.
 *
 * Usage:
 *   const { ReportEngine } = require("./engine/reportEngine");
 *   await ReportEngine.handle(req, res);
 */

const ReportEngine = {
  /**
   * Handle a report request end-to-end.
   *
   * @param {Object} req - Express request (expects req.query.id or req.query.category+type)
   * @param {Object} res - Express response
   */
  handle: async (req, res) => {
    try {
      // ── 1. Resolve report ID ────────────────────────────────────────────
      // Supports two URL styles:
      //   ?id=leave.history
      //   ?category=leave&type=history  (legacy compatibility)
      const reportId =
        req.query.id ||
        (req.query.category && req.query.type
          ? `${req.query.category}.${req.query.type}`
          : req.query.category
            ? `${req.query.category}.list`
            : null);

      if (!reportId) {
        return res.status(400).json({
          success: false,
          error: "Missing report ID. Use ?id=<category>.<type>",
        });
      }

      // ── 2. Look up config from registry ────────────────────────────────
      let config = getConfig(reportId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Report "${reportId}" not found in registry.`,
        });
      }

      // ── 3. Build MongoDB filter ─────────────────────────────────────────
      const filter = await buildQuery(config, req.query, req);

      // ── 4. Fetch data ───────────────────────────────────────────────────
      let rawDocs = await fetchData(config, filter);

      // 📊 Special Case: Leave Balance Report — pivot leave types into single-column-per-type layout
      if (config.pivotMode === "leaveBalance") {
        const empMap = {};
        const leaveTypes = new Set();

        rawDocs.forEach((doc) => {
          const empId =
            doc.employee_id?._id?.toString() || doc.employee_id?.toString();
          if (!empId) return;

          const lt = doc.leave_type || "Unknown";
          leaveTypes.add(lt);

          if (!empMap[empId]) {
            empMap[empId] = { _empDoc: doc.employee_id, leaveData: {} };
          }
          empMap[empId].leaveData[lt] = doc.balance ?? 0;
        });

        // Sort leave types alphabetically for stable column order
        const sortedTypes = [...leaveTypes].sort();

        // Build dynamic field map:  base fields + one column per leave type + Total
        const dynamicFieldMap = { ...config.fieldMap };
        sortedTypes.forEach((lt) => {
          dynamicFieldMap[`__lt_${lt}`] = lt; // shortname as header
        });
        dynamicFieldMap["__total"] = "Total"; // final total column

        // Build synthetic rows
        rawDocs = Object.values(empMap).map(({ _empDoc, leaveData }) => {
          const synth = { employee_id: _empDoc };
          let total = 0;
          sortedTypes.forEach((lt) => {
            const bal = leaveData[lt] ?? 0;
            synth[`__lt_${lt}`] = bal;
            total += bal;
          });
          synth["__total"] = total;
          return synth;
        });

        // Sort rows by employee name
        rawDocs.sort((a, b) => {
          const nameA = a.employee_id?.name || "";
          const nameB = b.employee_id?.name || "";
          return nameA.localeCompare(nameB);
        });

        config = { ...config, fieldMap: dynamicFieldMap, landscape: true };
      }

      // 📊 Special Case: Monthly Movement Summary (Aggregate by employee)
      if (config.pivotMode === "movementMonthly") {
        const empMap = {};

        const parseTime = (str) => {
          if (!str || !str.includes(":")) return null;
          const [h, m] = str.split(":").map(Number);
          return h * 60 + m;
        };

        const formatDuration = (mins) => {
          if (mins < 0) return "—";
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          if (h > 0) return `${h}h ${m}m`;
          return `${m}m`;
        };

        rawDocs.forEach((doc) => {
          const empId =
            doc.employee_id?._id?.toString() || doc.employee_id?.toString();
          if (!empId) return;

          if (!empMap[empId]) {
            empMap[empId] = {
              _empDoc: doc.employee_id,
              count: 0,
              totalMins: 0,
              types: {},
            };
          }

          const state = empMap[empId];
          state.count++;

          // Duration calc
          const outM = parseTime(doc.out_time);
          const inM = parseTime(doc.in_time);
          if (outM !== null && inM !== null && inM >= outM) {
            state.totalMins += inM - outM;
          }

          // Type tracking
          const t = doc.movement_type || "Other";
          state.types[t] = (state.types[t] || 0) + 1;
        });

        // Build synthetic rows
        rawDocs = Object.values(empMap).map(
          ({ _empDoc, count, totalMins, types }) => {
            // Find mode type
            let modeType = "—";
            let max = 0;
            for (const [t, c] of Object.entries(types)) {
              if (c > max) {
                max = c;
                modeType = t;
              }
            }

            return {
              employee_id: _empDoc,
              __count: count,
              __totalDuration: formatDuration(totalMins),
              __avgDuration: formatDuration(
                Math.round(totalMins / (count || 1)),
              ),
              __modeType: modeType,
            };
          },
        );

        // Sort by employee name
        rawDocs.sort((a, b) =>
          (a.employee_id?.name || "").localeCompare(b.employee_id?.name || ""),
        );
      }

      // 📊 Special Case: Daily Movement (Calculate duration per record)
      if (reportId === "movement.daily") {
        const parseTime = (str) => {
          if (!str || !str.includes(":")) return null;
          const [h, m] = str.split(":").map(Number);
          return h * 60 + m;
        };

        const formatDuration = (mins) => {
          if (mins < 0) return "—";
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          if (h > 0) return `${h}h ${m}m`;
          return `${m}m`;
        };

        rawDocs = rawDocs.map((doc) => {
          const outM = parseTime(doc.out_time);
          const inM = parseTime(doc.in_time);

          let durationStr = "—";
          if (outM !== null) {
            if (inM !== null && inM >= outM) {
              durationStr = formatDuration(inM - outM);
            } else if (!doc.in_time) {
              durationStr = "Active"; // Haven't returned yet
            }
          }

          return { ...doc, __duration: durationStr };
        });
      }

      // 📊 Special Case: Holiday Reports (Inject day/month strings)
      if (config.category === "holiday") {
        rawDocs = rawDocs.map((doc) => {
          if (!doc.date) return doc;
          const d = new Date(doc.date);
          const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });
          const monthName = d.toLocaleDateString("en-IN", { month: "long" });
          return { ...doc, __day: dayName, __month: monthName };
        });
        // Ensure chronological sort for holidays
        rawDocs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }

      // ── 5. Normalize ────────────────────────────────────────────────────
      const rows = normalizeData(rawDocs, config.fieldMap);
      const columns = getColumns(config.fieldMap);

      // ── 6. Respond ──────────────────────────────────────────────────────
      const download = req.query.download;
      const view = req.query.view;

      if (download === "pdf" || view === "pdf") {
        const tenantId = req.user?.tenant_id || null;
        return await generatePDF(
          rows,
          columns,
          config,
          req.query,
          tenantId,
          req.user,
          res,
        );
      }

      if (download === "csv") {
        const headers = columns.join(",");
        const csvRows = rows.map((row) =>
          columns
            .map((col) => {
              const val = row[col];
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(","),
        );
        const csvContent = [headers, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${reportId}_${Date.now()}.csv"`,
        );
        return res.send(csvContent);
      }

      // Default: JSON response for table display
      return res.json({
        success: true,
        reportId,
        label: config.label,
        columns,
        total: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error("[ReportEngine] Error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Return the registry metadata (all reports grouped by category).
   * Used by the frontend to dynamically build filter UIs.
   */
  getMeta: (req, res) => {
    try {
      const { getAllByCategory } = require("../registry");
      return res.json({ success: true, categories: getAllByCategory() });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};

module.exports = { ReportEngine };
