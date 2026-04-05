const payrollService = require("./service");

// 🛡 Multi-Tenant Payroll Resolvers
const resolvers = {
  Query: {
    salaryRecord: async (_, { employee_id }, ctx) => {
      return await payrollService.getSalaryRecord(employee_id);
    },
    payslips: async (_, { employee_id, pagination }, ctx) => {
      return await payrollService.getPayslips(employee_id, pagination);
    },
  },

  Mutation: {
    updateSalaryRecord: async (_, { employee_id, input }, ctx) => {
      return await payrollService.updateSalaryRecord(employee_id, input);
    },
    generatePayslip: async (_, { employee_id, month, amount }, ctx) => {
      return await payrollService.generatePayslip({ employee_id, month, amount });
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
