const EventLog = require("./model");
const { withTenant } = require("../../utils/tenantUtils");

exports.logEvent = async (data) => {
  try {
    const filter = withTenant({});
    const log = new EventLog({ ...data, ...filter });
    await log.save();
    return log.toObject();
  } catch (err) {
    console.error("Failed to log event:", err);
  }
};

exports.listEventLogs = async ({ module_name, action_type, user_id, record_id, date_from, date_to, pagination }) => {
  const filter = withTenant({});
  if (module_name) filter.module_name = module_name;
  if (action_type) filter.action_type = action_type;
  // Role-based filtering logic (Actor OR Subject)
  if (user_id || record_id) {
    const orConditions = [];
    
    if (user_id) {
      orConditions.push(Array.isArray(user_id) ? { user_id: { $in: user_id } } : { user_id });
    }
    
    if (record_id) {
      orConditions.push(Array.isArray(record_id) ? { record_id: { $in: record_id } } : { record_id });
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }
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
    EventLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    EventLog.countDocuments(filter)
  ]);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount
    }
  };
};
