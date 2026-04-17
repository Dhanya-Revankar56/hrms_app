const Holiday = require("./model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");

exports.listHolidays = async ({ year, month, pagination }) => {
  const filter = withTenant({});

  if (year || month) {
    const y = year || new Date().getFullYear();
    if (month) {
      const start = new Date(y, month - 1, 1);
      const end = new Date(y, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 100;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Holiday.find(filter).sort({ date: 1 }).skip(skip).limit(limit).lean(),
    Holiday.countDocuments(filter),
  ]);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount,
    },
  };
};

exports.getHolidayById = async (id) => {
  return await Holiday.findOne(withTenant({ _id: id })).lean();
};

exports.createHoliday = async (data, context) => {
  const filter = withTenant({});
  const holiday = new Holiday({ ...data, ...filter });

  let saved;
  try {
    saved = await holiday.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(
        `A holiday on this date already exists for this campus.`,
        { cause: error },
      );
    }
    throw error;
  }

  // Log to EventRegister via service (consolidated to avoid duplicates)
  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: context.user?.name || "Admin",
    user_role: context.user?.role || "ADMIN",
    module_name: "Holidays",
    action_type: "CREATED",
    module: "Holidays",
    record_id: saved._id,
    description: `${saved.name} holiday is created`,
  });

  return saved.toObject();
};

exports.updateHoliday = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const updated = await Holiday.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true },
  ).lean();

  if (!updated) throw new Error("Holiday record not found");

  // Log to EventRegister (consolidated)
  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: context.user?.name || "Admin",
    user_role: context.user?.role || "ADMIN",
    module_name: "Holidays",
    action_type: "UPDATED",
    module: "Holidays",
    record_id: id,
    description: `${updated.name} holiday details were updated`,
  });

  return updated;
};

exports.deleteHoliday = async (id, context) => {
  const filter = withTenant({ _id: id });
  const holiday = await Holiday.findOneAndDelete(filter).lean();

  if (!holiday) throw new Error("Holiday record not found");

  // Log to EventRegister (consolidated)
  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: context.user?.name || "Admin",
    user_role: context.user?.role || "ADMIN",
    module_name: "Holidays",
    action_type: "DELETED",
    module: "Holidays",
    record_id: id,
    description: `${holiday.name} holiday has been deleted`,
  });

  return { success: true, message: "Holiday record deleted successfully" };
};
