const Attendance = require("./model");
const { withTenant, applyTenantFilter, getUserIdFromCtx } = require("../../utils/tenantUtils");
const AuditLog = require("../audit/model");

exports.listAttendance = async ({ employee_id, status, from_date, to_date, pagination }) => {
  const filter = withTenant({});
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

exports.getAttendanceById = async (id) => {
  const filter = withTenant({ _id: id });
  const rec = await Attendance.findOne(filter).lean();
  if (!rec) throw new Error("Attendance record not found");
  return rec;
};

exports.createAttendance = async (data) => {
  const filter = withTenant({});
  const record = new Attendance({ ...data, ...filter });
  const saved = await record.save();
  return saved.toObject();
};

exports.updateAttendance = async (id, data, context) => {
  const filter = withTenant({ _id: id });
  const updated = await Attendance.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new Error("Attendance record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "ATTENDANCE_UPDATED",
    user_id: getUserIdFromCtx(context),
    tenant_id: filter.tenant_id,
    metadata: { attendance_id: id, status: updated.status }
  });

  return updated;
};

exports.deleteAttendance = async (id, context) => {
  const filter = withTenant({ _id: id });
  const deleted = await Attendance.findOneAndDelete(filter).lean();
  if (!deleted) throw new Error("Attendance record not found");

  // 🛡 Audit Log
  await AuditLog.create({
    action: "ATTENDANCE_DELETED",
    user_id: getUserIdFromCtx(context),
    tenant_id: filter.tenant_id,
    metadata: { attendance_id: id }
  });

  return { success: true, message: "Attendance record deleted successfully" };
};
