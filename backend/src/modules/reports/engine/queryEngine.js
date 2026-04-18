const mongoose = require("mongoose");
const { withTenant } = require("../../../utils/tenantUtils");
const Employee = require("../../employee/model");

/**
 * 🔧 QUERY ENGINE
 * Dynamically builds a MongoDB filter object from a report config + HTTP query params.
 */

// Safely cast to ObjectId if valid
const toObjectId = (val) => {
  if (!val || typeof val !== "string") return val;
  if (/^[0-9a-fA-F]{24}$/.test(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  return val;
};

const parseDate = (str, isEnd = false) => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  if (isEnd) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
};

/**
 * Resolve a special filter type (e.g. "Resolve all employees in Department X").
 */
const resolveSpecialFilter = async (filterDef, value, req = null) => {
  if (filterDef.subQuery === "employeesByDepartment") {
    const deptId = toObjectId(value);
    const employees = await Employee.find(
      withTenant({ "work_detail.department": deptId }, req),
    )
      .setOptions({ skipTenant: true })
      .select("_id user_id")
      .lean();

    const targetIds = employees.map((e) => e._id);
    const actorIds = employees.map((e) => e.user_id).filter((id) => id);

    // If the report expects a single field (like employee_id or user_id),
    // we return the array of IDs.
    if (filterDef.applyTo) {
      return { $in: targetIds };
    }

    // 🏰 Fallback for Event Log reports which require spreading multiple keys
    return {
      __spreadKeys: true,
      user_id: filterDef.castToString
        ? actorIds.map((id) => id.toString())
        : actorIds,
      record_id: filterDef.castToString
        ? targetIds.map((id) => id.toString())
        : targetIds,
    };
  }

  // 🕒 2. Check if a leave record overlaps a specific date
  if (filterDef.subQuery === "activeOnDate") {
    const targetDate = parseDate(value);
    if (!targetDate) return null;

    // Create a 24-hour range for the selected date to capture leaves
    // starting or ending at any time within that day.
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      __spreadKeys: true,
      from_date: { $lte: endOfDay },
      to_date: { $gte: startOfDay },
    };
  }

  if (filterDef.subQuery === "employeesByCategory") {
    const categories = value.split(",").map((v) => v.trim());
    const employees = await Employee.find(
      withTenant({ "personal_detail.category": { $in: categories } }, req),
    )
      .setOptions({ skipTenant: true })
      .select("_id")
      .lean();

    const ids = employees.map((e) => e._id);
    return { $in: ids };
  }

  return value;
};

const buildQuery = async (config, params, req = null) => {
  const filter = {};

  // 1️⃣ Pre-filters
  if (config.preFilter) {
    Object.assign(filter, config.preFilter);
  }

  // 🏰 Security Enforcement: HOD/EMPLOYEE scoping
  if (
    req?.user &&
    (req.user.role === "HEAD OF DEPARTMENT" || req.user.role === "EMPLOYEE")
  ) {
    const empRecord = await Employee.findOne(
      withTenant({ user_id: req.user.id }, req),
    )
      .select("work_detail.department")
      .lean();

    console.log(
      `[QueryEngine] UserID: ${req?.user?.id}, Role: ${req?.user?.role}, Resolved Dept:`,
      empRecord?.work_detail?.department,
    );

    if (empRecord?.work_detail?.department) {
      // Overwrite departmentId param to only allow their own department
      params.departmentId = empRecord.work_detail.department.toString();
    }
  }

  // 2️⃣ Dynamic Filters
  for (const filterDef of config.filters || []) {
    const rawValue = params[filterDef.key];

    if (
      rawValue === undefined ||
      rawValue === null ||
      rawValue === "" ||
      rawValue.toString().toLowerCase() === "all"
    ) {
      continue;
    }

    if (filterDef.subQuery) {
      const resolvedValue = await resolveSpecialFilter(
        filterDef,
        rawValue,
        req,
      );

      // null means invalid/missing value — skip
      if (resolvedValue === null || resolvedValue === undefined) continue;

      // __spreadKeys flag: spread individual keys directly into the filter
      if (typeof resolvedValue === "object" && resolvedValue.__spreadKeys) {
        const { __spreadKeys: _ignored, ...rest } = resolvedValue;
        Object.assign(filter, rest);
        continue;
      }

      // No applyTo → spread the whole object into the filter (legacy $and pattern)
      if (
        typeof resolvedValue === "object" &&
        !Array.isArray(resolvedValue) &&
        !filterDef.applyTo
      ) {
        Object.assign(filter, resolvedValue);
      } else if (filterDef.applyTo) {
        filter[filterDef.applyTo] = resolvedValue;
      }
      continue;
    }

    switch (filterDef.type) {
      case "date": {
        const date = parseDate(rawValue, filterDef.op === "$lte");
        if (!date) break;
        if (!filter[filterDef.applyTo]) filter[filterDef.applyTo] = {};
        filter[filterDef.applyTo][filterDef.op] = date;
        break;
      }

      case "objectId": {
        filter[filterDef.applyTo] = toObjectId(rawValue);
        break;
      }

      case "enum":
      case "string": {
        if (filterDef.op === "$in") {
          filter[filterDef.applyTo] = {
            $in: rawValue.split(",").map((v) => v.trim()),
          };
        } else {
          // Standard string matching is made case-insensitive using a regex
          filter[filterDef.applyTo] = {
            $regex: new RegExp(`^${rawValue.trim()}$`, "i"),
          };
        }
        break;
      }

      case "boolean": {
        filter[filterDef.applyTo] = rawValue === "true";
        break;
      }

      case "academicYear": {
        const parts = rawValue.split("-");
        if (parts.length !== 2) break;
        const startYear = parseInt(parts[0]);
        const endYear = 2000 + parseInt(parts[1]); // Assuming 20s
        const start = new Date(startYear, 5, 1); // June 1st
        const end = new Date(endYear, 4, 31, 23, 59, 59, 999); // May 31st
        filter[filterDef.applyTo] = { $gte: start, $lte: end };
        break;
      }

      case "month": {
        const [year, month] = rawValue.split("-").map(Number);
        if (!year || !month) break;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        filter[filterDef.applyTo] = { $gte: start, $lte: end };
        break;
      }

      default:
        if (filterDef.applyTo) {
          filter[filterDef.applyTo] = rawValue;
        }
    }
  }

  return withTenant(filter, req);
};

module.exports = { buildQuery };
