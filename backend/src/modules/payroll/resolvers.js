const payrollService = require("./service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    salaryRecord: async (_, { employee_id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await payrollService.getSalaryRecord(employee_id, institution_id);
    },
    payslips: async (_, { employee_id, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await payrollService.getPayslips(employee_id, institution_id, pagination);
    },
  },

  Mutation: {
    updateSalaryRecord: async (_, { employee_id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await payrollService.updateSalaryRecord(employee_id, input, institution_id);
    },
    generatePayslip: async (_, { employee_id, month, amount }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await payrollService.generatePayslip({ employee_id, month, amount }, institution_id);
    },
  },

  SalaryRecord: {
    id: (parent) => parent._id?.toString() || "temp-id",
  },
  Payslip: {
    id: (parent) => parent._id.toString(),
  }
};

module.exports = resolvers;
