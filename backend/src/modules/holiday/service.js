const Holiday = require("./model");

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
  return await holiday.save();
};

exports.updateHoliday = async (id, data, institution_id) => {
  const updated = await Holiday.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: data },
    { new: true }
  );
  if (!updated) throw new Error("Holiday record not found");
  return updated;
};

exports.deleteHoliday = async (id, institution_id) => {
  const deleted = await Holiday.findOneAndDelete({ _id: id, institution_id });
  if (!deleted) throw new Error("Holiday record not found");
  return { success: true, message: "Holiday record deleted successfully" };
};
