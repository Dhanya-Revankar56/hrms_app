const relievingService = require("./service");
const employeeService = require("../employee/service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    relievings: async (_, { employee_id, status, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await relievingService.listRelievings({ institution_id, employee_id, status, pagination });
    },
    relieving: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await relievingService.getRelievingById(id, institution_id);
    },
  },

  Mutation: {
    createRelieving: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await relievingService.createRelieving({ ...input, institution_id });
    },
    updateRelieving: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await relievingService.updateRelieving(id, input, institution_id);
    },
    deleteRelieving: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await relievingService.deleteRelieving(id, institution_id);
    },
  },

  Relieving: {
    id: (parent) => parent._id?.toString() || parent.id,
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      return await employeeService.getEmployeeById(parent.employee_id, parent.institution_id);
    },
  },
};

module.exports = resolvers;
