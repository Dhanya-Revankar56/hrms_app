const Holiday = require("./model");
const eventLogService = require("../eventLog/service");

exports.listHolidays = async ({ institution_id, year, month }) => {
  const filter = { institution_id };
  if (year && month !== undefined) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  }
  return await Holiday.find(filter).sort({ date: 1 }).lean();
};

exports.getHolidayById = async (id, institution_id) => {
  const rec = await Holiday.findOne({ _id: id, institution_id }).lean();
  if (!rec) throw new Error("Holiday record not found");
  return rec;
};

exports.createHoliday = async (data) => {
  const holiday = new Holiday(data);
  const saved = await holiday.save();

  // Audit Log
  await eventLogService.logEvent({
    institution_id: data.institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "holidays",
    action_type: "CREATE",
    record_id: saved._id.toString(),
    description: `New holiday created: ${saved.name} on ${new Date(saved.date).toDateString()}`,
    new_data: saved.toObject()
  });

  return saved;
};

exports.updateHoliday = async (id, data, institution_id) => {
  const existing = await Holiday.findOne({ _id: id, institution_id }).lean();
  const updated = await Holiday.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: data },
    { new: true }
  ).lean();
  if (!updated) throw new Error("Holiday record not found");

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "holidays",
    action_type: "UPDATE",
    record_id: id,
    description: `Holiday updated: ${updated.name}`,
    old_data: existing,
    new_data: updated
  });

  return updated;
};

exports.deleteHoliday = async (id, institution_id) => {
  const deleted = await Holiday.findOneAndDelete({ _id: id, institution_id }).lean();
  if (!deleted) throw new Error("Holiday record not found");

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "holidays",
    action_type: "DELETE",
    record_id: id,
    description: `Holiday deleted: ${deleted.name} (${new Date(deleted.date).toDateString()})`,
    old_data: deleted
  });

  return { success: true, message: "Holiday record deleted successfully" };
};
