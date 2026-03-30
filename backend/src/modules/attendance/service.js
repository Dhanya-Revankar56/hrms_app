const Attendance = require("./model");
const eventLogService = require("../eventLog/service");

exports.listAttendance = async ({ institution_id, employee_id, status, from_date, to_date, pagination }) => {
  const filter = { institution_id };
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = status;
  if (from_date && to_date) {
    filter.date = { $gte: new Date(from_date), $lte: new Date(to_date) };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Attendance.countDocuments(filter)
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

exports.getAttendanceById = async (id, institution_id) => {
  const rec = await Attendance.findOne({ _id: id, institution_id }).lean();
  if (!rec) throw new Error("Attendance record not found");
  return rec;
};

exports.createAttendance = async (data) => {
  const record = new Attendance(data);
  const saved = await record.save();

  // Audit Log
  await eventLogService.logEvent({
    institution_id: data.institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "attendance",
    action_type: "CREATE",
    record_id: saved._id.toString(),
    description: `Attendance record created for employee ${data.employee_id} on ${new Date(data.date).toDateString()}`,
    new_data: saved.toObject()
  });

  return saved.toObject();
};

exports.updateAttendance = async (id, data, institution_id) => {
  const existing = await Attendance.findOne({ _id: id, institution_id }).lean();
  const updated = await Attendance.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw new Error("Attendance record not found");

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "attendance",
    action_type: "UPDATE",
    record_id: id,
    description: `Attendance updated for employee ${updated.employee_id}: Status changed to ${updated.status}`,
    old_data: existing,
    new_data: updated
  });

  return updated;
};

exports.deleteAttendance = async (id, institution_id) => {
  const deleted = await Attendance.findOneAndDelete({ _id: id, institution_id }).lean();
  if (!deleted) throw new Error("Attendance record not found");

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "attendance",
    action_type: "DELETE",
    record_id: id,
    description: `Attendance record deleted for employee ${deleted.employee_id} on ${new Date(deleted.date).toDateString()}`,
    old_data: deleted
  });

  return { success: true, message: "Attendance record deleted successfully" };
};
