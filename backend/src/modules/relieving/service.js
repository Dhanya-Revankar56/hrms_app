const Relieving = require("./model");
const Employee = require("../employee/model");
const User = require("../auth/user.model");
const AuditLog = require("../audit/model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");

exports.listRelievings = async ({ employee_id, status, department, pagination }) => {
  const filter = withTenant({});
  if (status) filter.status = status;
  if (employee_id) filter.employee_id = employee_id;

  // 🛡 Optional: Filter by department (requires lookup if not indexed in Relieving)
  if (department) {
    const employeesInDept = await Employee.find(withTenant({ "work_detail.department": department }))
      .select("_id")
      .lean();
    const empIds = employeesInDept.map(e => e._id);
    filter.employee_id = { $in: empIds };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Relieving.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employee_id")
      .lean(),
    Relieving.countDocuments(filter)
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

exports.getRelievingById = async (id) => {
  const relieving = await Relieving.findOne(withTenant({ _id: id }))
    .populate("employee_id")
    .lean();
  if (!relieving) throw new Error("Relieving request not found");
  return relieving;
};

exports.createRelieving = async (data, context) => {
  const filter = withTenant({});
  const record = new Relieving({ ...data, ...filter });
  const saved = await record.save();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "RELIEVE_CREATE",
    user_id: getUserIdFromCtx(context) || data.employee_id,
    tenant_id: filter.tenant_id,
    metadata: { relieving_id: saved._id, date: data.resignation_date }
  });

  return saved.toObject();
};

exports.updateRelieving = async (id, input, context) => {
  const filter = withTenant({ _id: id });
  const relieving = await Relieving.findOne(filter);
  if (!relieving) throw new Error("Relieving request not found");

  const updated = await Relieving.findOneAndUpdate(
    filter,
    { $set: { ...input, updatedAt: new Date() } },
    { new: true }
  ).lean();

  // 🛡 1. If approved, deactivate Employee and User
  if (input.status === "Approved" || input.status === "Relieved") {
    const emp = await Employee.findOne(withTenant({ _id: relieving.employee_id }));
    if (emp) {
      await Promise.all([
        Employee.updateOne({ _id: emp._id }, { $set: { app_status: "relieved", is_active: false } }),
        User.updateOne({ _id: emp.user_id }, { $set: { isActive: false } })
      ]);
    }
  }

  // 🛡 2. Audit Log
  const isFinal = input.status === "Approved" || input.status === "Relieved";
  await AuditLog.create({
    action: isFinal ? "RELIEVED" : "RELIEVING_UPDATED",
    user_id: getUserIdFromCtx(context),
    tenant_id: filter.tenant_id,
    metadata: { relieving_id: id, status: input.status || relieving.status }
  });

  return updated;
};

exports.deleteRelieving = async (id) => {
  const result = await Relieving.deleteOne(withTenant({ _id: id }));
  return { success: result.deletedCount > 0, message: result.deletedCount > 0 ? "Deleted successfully" : "Not found" };
};
