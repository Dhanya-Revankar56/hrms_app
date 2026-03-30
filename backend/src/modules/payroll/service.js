const { SalaryRecord, Payslip } = require("./model");
const eventLogService = require("../eventLog/service");

const getSalaryRecord = async (employee_id, institution_id) => {
  let record = await SalaryRecord.findOne({ employee_id, institution_id });
  if (!record) {
    // Return empty record if not found
    return {
      employee_id,
      monthly_ctc: 0,
      annual_ctc: 0,
      net_monthly_salary: 0,
      net_annual_salary: 0,
      earnings: { basic: 0, agp: 0, da: 0, hra: 0 },
      status: "none"
    };
  }
  return record;
};

const updateSalaryRecord = async (employee_id, input, institution_id) => {
  const existing = await SalaryRecord.findOne({ employee_id, institution_id }).lean();
  const updated = await SalaryRecord.findOneAndUpdate(
    { employee_id, institution_id },
    { $set: { ...input, institution_id, employee_id } },
    { upsert: true, new: true }
  ).lean();

  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "payroll",
    action_type: "UPDATE",
    record_id: updated._id.toString(),
    description: `Salary record updated for employee: ${employee_id}`,
    old_data: existing,
    new_data: updated
  });

  return updated;
};

const getPayslips = async (employee_id, institution_id, pagination) => {
  const filter = { employee_id, institution_id };
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Payslip.find(filter).sort({ month: -1 }).skip(skip).limit(limit).lean(),
    Payslip.countDocuments(filter)
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

const generatePayslip = async (input, institution_id) => {
  const saved = await Payslip.create({ ...input, institution_id });
  
  // Audit Log
  await eventLogService.logEvent({
    institution_id,
    user_name: "Admin",
    user_role: "HR Administrator",
    module_name: "payroll",
    action_type: "CREATE",
    record_id: saved._id.toString(),
    description: `Payslip generated for employee ${input.employee_id} for period ${input.month}/${input.year}`,
    new_data: saved.toObject()
  });

  return saved;
};

module.exports = {
  getSalaryRecord,
  updateSalaryRecord,
  getPayslips,
  generatePayslip
};
