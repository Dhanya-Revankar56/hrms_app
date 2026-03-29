const { SalaryRecord, Payslip } = require("./model");

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
  return await SalaryRecord.findOneAndUpdate(
    { employee_id, institution_id },
    { $set: { ...input, institution_id, employee_id } },
    { upsert: true, new: true }
  );
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
  return await Payslip.create({ ...input, institution_id });
};

module.exports = {
  getSalaryRecord,
  updateSalaryRecord,
  getPayslips,
  generatePayslip
};
