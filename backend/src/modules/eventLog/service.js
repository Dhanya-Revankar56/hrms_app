const EventLog = require("./model");

exports.logEvent = async (data) => {
  try {
    const log = new EventLog(data);
    await log.save();
    return log.toObject();
  } catch (err) {
    console.error("Failed to log event:", err);
  }
};

exports.listEventLogs = async ({ institution_id, module_name, action_type, user_id, date_from, date_to, pagination }) => {
  const filter = { institution_id };
  if (module_name) filter.module_name = module_name;
  if (action_type) filter.action_type = action_type;
  if (user_id) filter.user_id = user_id;
  
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
