const Holiday = require("./model");
const AuditLog = require("../audit/model");
const { withTenant } = require("../../utils/tenantUtils");

exports.listHolidays = async ({ year, month, pagination }) => {
  const filter = withTenant({ is_active: true });
  
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
    Holiday.countDocuments(filter)
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
      throw new Error(`A holiday on this date already exists for this campus.`);
    }
    throw error;
  }

  // 🛡 Audit Log
  await AuditLog.create({
    action: "HOLIDAY_CREATED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { holiday_name: saved.name, date: saved.date }
  });

  return saved.toObject();
};

exports.updateHoliday = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const updated = await Holiday.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true }
  ).lean();

  if (!updated) throw new Error("Holiday record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "HOLIDAY_UPDATED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { holiday_id: id, name: updated.name }
  });

  return updated;
};

exports.deleteHoliday = async (id, context) => {
  const filter = withTenant({ _id: id });
  const holiday = await Holiday.findOneAndUpdate(
    filter,
    { $set: { is_active: false } },
    { new: true }
  ).lean();

  if (!holiday) throw new Error("Holiday record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "HOLIDAY_DELETED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { holiday_id: id, name: holiday.name }
  });

  return { success: true, message: "Holiday record deleted successfully" };
};
