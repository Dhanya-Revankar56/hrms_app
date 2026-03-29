const movementService = require("./service");
const employeeService = require("../employee/service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    movements: async (_, { employee_id, status, movement_type, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await movementService.listMovements({ institution_id, employee_id, status, movement_type, pagination });
    },
    movement: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await movementService.getMovementById(id, institution_id);
    },
  },

  Mutation: {
    createMovement: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await movementService.createMovement({ ...input, institution_id });
    },
    updateMovement: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await movementService.updateMovement(id, input, institution_id);
    },
    deleteMovement: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await movementService.deleteMovement(id, institution_id);
    },
  },

  Movement: {
    id: (parent) => parent._id?.toString() || parent.id,
    movement_date: (parent) => {
      if (!parent.movement_date) return null;
      try {
        return new Date(parent.movement_date).toISOString();
      } catch (_e) {
        return parent.movement_date;
      }
    },
    employee: async (parent) => {
      if (parent.employee && parent.employee._id) return parent.employee;
      if (!parent.employee_id) return null;
      return await employeeService.getEmployeeById(parent.employee_id, parent.institution_id);
    },
  },
};

module.exports = resolvers;
