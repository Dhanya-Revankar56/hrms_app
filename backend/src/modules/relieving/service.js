const Relieving = require("./model");
const Employee = require("../employee/model");
const User = require("../auth/user.model");
const AuditLog = require("../audit/model");
const { withTenant } = require("../../utils/tenantUtils");

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

exports.applyForRelieving = async (data, context) => {
  const filter = withTenant({});
  const record = new Relieving({ ...data, ...filter });
  const saved = await record.save();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "RELIEVING_APPLY",
    user_id: context?.user?.id || data.employee_id,
    tenant_id: filter.tenant_id,
    metadata: { relieving_id: saved._id, date: data.relieved_at }
  });

  return saved.toObject();
};

exports.updateRelievingStatus = async (id, status, context) => {
  const filter = withTenant({ _id: id });
  const relieving = await Relieving.findOne(filter);
  if (!relieving) throw new Error("Relieving request not found");

  const updated = await Relieving.findOneAndUpdate(
    filter,
    { $set: { status, updatedAt: new Date() } },
    { new: true }
  ).lean();

  // 🛡 1. If approved, deactivate Employee and User
  if (status === "Approved") {
    const emp = await Employee.findOne(withTenant({ _id: relieving.employee_id }));
    if (emp) {
      await Promise.all([
        Employee.updateOne({ _id: emp._id }, { $set: { status: "relieved", is_active: false } }),
        User.updateOne({ _id: emp.user_id }, { $set: { isActive: false } })
      ]);
    }
  }

  // 🛡 2. Audit Log
  await AuditLog.create({
    action: "RELIEVING_STATUS_UPDATED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id: filter.tenant_id,
    metadata: { relieving_id: id, status }
  });

  return updated;
};
