const AuditLog = require("../audit/model");
const Employee = require("../employee/model");
const mongoose = require("mongoose");
const { withTenant } = require("../../utils/tenantUtils");

/**
 * Standardizes audit actions into UI event categories
 */
const mapActionToEvent = (action) => {
  const upper = (action || "").toUpperCase();
  if (upper.includes("JOINED") || upper.includes("ONBOARDING")) return "JOINED";
  if (upper.includes("RELIEVED") || upper.includes("EXIT")) return "RELIEVED";
  if (upper.includes("CREATE") || upper.includes("APPLY")) return "CREATED";
  if (upper.includes("DELETE") || upper.includes("REMOVE")) return "DELETED";
  return "UPDATED";
};

/**
 * Extracts a friendly module name from the action string
 */
const formatDate = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
};

const extractModule = (action) => {
  const parts = (action || "").split("_");
  return parts[0]?.toLowerCase() || "system";
};

exports.logEvent = async (data) => {
  // Pass-through to AuditLog for modern unified logging
  try {
    const filter = withTenant({});
    const log = new AuditLog({
      action: data.action_type || `${data.module_name}_${data.action_type}`,
      module:
        data.module || data.module_name || extractModule(data.action_type),
      user_id: data.user_id,
      tenant_id: filter.tenant_id,
      metadata: {
        ...data.new_data,
        ...data.changes,
        description: data.description,
        record_id: data.record_id,
        module: data.module || data.module_name,
      },
    });
    await log.save();
    return log.toObject();
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
};

exports.listEventLogs = async ({
  module_name,
  action_type,
  user_id,
  record_id,
  date_from,
  date_to,
  search,
  pagination,
}) => {
  const filter = withTenant({});
  const orConditions = [];

  if (search) {
    orConditions.push({
      "metadata.description": { $regex: new RegExp(search, "i") },
    });
  }

  // 🛡 Exclusion: Hide technical logs (login, session, etc.) from the Business Event Register
  filter.action = { $nin: ["USER_LOGIN", "USER_LOGOUT", "USER_REFRESH"] };

  // Filter by module if provided
  if (module_name) {
    filter.module = module_name;
  }

  if (action_type) {
    // This is trickier since we map it, but we can search for substrings
    filter.action = new RegExp(action_type, "i");
  }

  if (user_id) {
    orConditions.push(
      Array.isArray(user_id) ? { user_id: { $in: user_id } } : { user_id },
    );
  }

  if (record_id) {
    // Record ID could be in various metadata fields (e.g., employee_id, relieving_id, leave_id)
    const recIdsStr = Array.isArray(record_id)
      ? record_id.map((id) => id.toString())
      : [record_id.toString()];
    const recIdsObj = recIdsStr
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const allRecIds = [...recIdsStr, ...recIdsObj];

    orConditions.push({
      $or: [
        { "metadata.id": { $in: allRecIds } },
        { "metadata.employee_id": { $in: allRecIds } },
        { "metadata.relieving_id": { $in: allRecIds } },
        { "metadata.leave_id": { $in: allRecIds } },
        { "metadata.movement_id": { $in: allRecIds } },
        { "metadata.attendance_id": { $in: allRecIds } },
        { "metadata.record_id": { $in: allRecIds } },
      ],
    });
  }

  if (orConditions.length > 0) {
    filter.$or = orConditions;
  }

  if (date_from || date_to) {
    filter.timestamp = {};
    if (date_from) filter.timestamp.$gte = new Date(date_from);
    if (date_to) filter.timestamp.$lte = new Date(date_to);
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  // Enrich with Employee details for display names
  const userIds = items
    .map((i) => i.user_id?._id || i.user_id)
    .filter((id) => id);
  const employees = await Employee.find({ user_id: { $in: userIds } })
    .select("user_id first_name last_name")
    .lean();
  const empMap = employees.reduce((acc, e) => {
    acc[e.user_id.toString()] = `${e.first_name} ${e.last_name}`;
    return acc;
  }, {});

  // Map to EventLog schema
  const mappedItems = items.map((i) => ({
    id: i._id.toString(),
    user_id: (i.user_id?._id || i.user_id)?.toString(),
    user_name:
      empMap[(i.user_id?._id || i.user_id)?.toString()] ||
      i.user_id?.email ||
      "System",
    user_role: i.user_id?.role || "SYSTEM",
    action_type: mapActionToEvent(i.action),
    module_name: i.module || extractModule(i.action),
    description: i.metadata?.description || `Performed ${i.action} action`,
    new_data: i.metadata,
    timestamp: i.timestamp.toISOString(),
    formatted_timestamp: formatDate(i.timestamp),
    tenant_id: i.tenant_id.toString(),
  }));

  return {
    items: mappedItems,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount,
    },
  };
};
