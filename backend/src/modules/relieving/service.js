const Relieving = require("./model");
const Employee = require("../employee/model");
const User = require("../auth/user.model");
const { withTenant, getUserIdFromCtx } = require("../../utils/tenantUtils");

exports.listRelievings = async ({
  employee_id,
  status,
  department,
  pagination,
}) => {
  const filter = withTenant({});
  if (status) filter.status = status;
  if (employee_id) filter.employee_id = employee_id;

  // 🛡 Optional: Filter by department (requires lookup if not indexed in Relieving)
  if (department) {
    const employeesInDept = await Employee.find(
      withTenant({ "work_detail.department": department }),
    )
      .select("_id")
      .lean();
    const empIds = employeesInDept.map((e) => e._id);
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
    Relieving.countDocuments(filter),
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
  const emp = await Employee.findById(data.employee_id).lean();
  const empName = emp ? emp.name : "Employee";

  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context) || data.employee_id,
    user_name: empName,
    user_role: "EMPLOYEE",
    module_name: "Relieving",
    action_type: "CREATED",
    module: "Relieving",
    record_id: saved._id,
    description: `${empName} applied for relieving`,
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
    { new: true },
  ).lean();

  // 🛡 1. If approved, deactivate Employee and User, and save Audit Info
  if (input.status === "Approved" || input.status === "Relieved") {
    const emp = await Employee.findOne(
      withTenant({ _id: relieving.employee_id }),
    );
    if (emp) {
      await Promise.all([
        Employee.updateOne(
          { _id: emp._id },
          { $set: { status: "inactive", is_active: false } },
        ),
        User.updateOne({ _id: emp.user_id }, { $set: { isActive: false } }),
      ]);
    }

    // Capture Audit Details in the document for reporting
    await Relieving.updateOne(
      { _id: id },
      {
        $set: {
          approved_by: {
            user_name: "Admin", // Default if no name in context
            user_role: context.user?.role || "ADMIN",
          },
          approved_at: new Date(),
        },
      },
    );
  }

  // 🛡 2. Audit Log
  const isFinal = input.status === "Approved" || input.status === "Relieved";
  let empName = "Employee";
  if (isFinal) {
    const emp = await Employee.findOne(
      withTenant({ _id: relieving.employee_id }),
    );
    if (emp) empName = emp.name;
  }

  const eventLogService = require("../eventLog/service");
  await eventLogService.logEvent({
    user_id: getUserIdFromCtx(context),
    user_name: "Admin",
    user_role: context.user?.role || "ADMIN",
    module_name: "Relieving",
    action_type: isFinal ? "RELIEVED" : "UPDATED",
    module: "Relieving",
    record_id: id,
    description: isFinal
      ? `${empName} is relieved`
      : `${empName}'s relieving record was updated`,
  });

  return updated;
};

exports.deleteRelieving = async (id) => {
  const result = await Relieving.deleteOne(withTenant({ _id: id }));
  return {
    success: result.deletedCount > 0,
    message: result.deletedCount > 0 ? "Deleted successfully" : "Not found",
  };
};
