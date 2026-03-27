const leaveService = require("./service");
const employeeService = require("../employee/service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    leaves: async (_, { employee_id, status, leave_type, department, search, month, year, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.listLeaves({ institution_id, employee_id, status, leave_type, department, search, month, year, pagination });
    },
    leave: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.getLeaveById(id, institution_id);
    },
    leaveBalances: async (_, { employee_id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.listLeaveBalances(employee_id, institution_id);
    },
  },

  Mutation: {
    applyLeave: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.applyLeave({ ...input, institution_id });
    },
    updateLeaveApproval: async (_, { id, role, status, remarks }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.updateLeaveApproval({ id, role, status, remarks, institution_id });
    },
    cancelLeave: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.cancelLeave(id, institution_id);
    },
    createLeave: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.createLeave({ ...input, institution_id });
    },
    updateLeave: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.updateLeave(id, input, institution_id);
    },
    deleteLeave: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.deleteLeave(id, institution_id);
    },
  },

  Leave: {
    id: (parent) => parent._id?.toString() || parent.id,
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      return await employeeService.getEmployeeById(parent.employee_id, parent.institution_id);
    },
  },

  LeaveBalance: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = resolvers;
