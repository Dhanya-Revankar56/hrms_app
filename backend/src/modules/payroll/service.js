const Payroll = require("./model");
const Employee = require("../employee/model");
const AuditLog = require("../audit/model");
const { withTenant } = require("../../utils/tenantUtils");

exports.listPayroll = async ({ tenant_id, employee_id, month, year, status, pagination }) => {
  const filter = withTenant({ tenant_id });
  if (employee_id) filter.employee_id = employee_id;
  if (month) filter.month = month;
  if (year) filter.year = year;
  if (status) filter.status = status;

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Payroll.find(filter).sort({ year: -1, month: -1 }).skip(skip).limit(limit).populate("employee").lean(),
    Payroll.countDocuments(filter)
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

exports.getPayrollById = async (id, tenant_id) => {
  const rec = await Payroll.findOne(withTenant({ _id: id, tenant_id })).populate("employee").lean();
  if (!rec) throw new Error("Payroll record not found");
  return rec;
};

exports.runPayroll = async (data, context) => {
  const tenant_id = data.tenant_id || data.institution_id;
  
  // Logic for running payroll for a month
  const record = new Payroll({ ...data, tenant_id });
  const saved = await record.save();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "PAYROLL_RUN",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id,
    metadata: { month: data.month, year: data.year, employee_count: 1 }
  });

  return saved.toObject();
};

exports.updatePayrollStatus = async (id, status, tenant_id, context) => {
  const filter = withTenant({ _id: id, tenant_id });
  const updated = await Payroll.findOneAndUpdate(
    filter,
    { $set: { status } },
    { new: true }
  ).lean();

  // 🛡 Audit Log
  await AuditLog.create({
    action: "PAYROLL_STATUS_UPDATED",
    user_id: context?.user?.id || context?.req?.user?.id,
    tenant_id,
    metadata: { payroll_id: id, status }
  });

  return updated;
};
