const movementService = require("./service");
const Employee = require("../employee/model");
const employeeService = require("../employee/service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    movements: async (_, { employee_id, status, movement_type, department, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      const role = ctx.user?.role;
      
      let filterId = employee_id;
      let filterDept = department;

      if (role === "EMPLOYEE") {
        filterId = ctx.user.id;
      } else if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ _id: ctx.user.id, institution_id })
          .select("work_detail.department")
          .lean();
        filterDept = hodRecord?.work_detail?.department?.toString();
      }

      return await movementService.listMovements({ 
        institution_id, 
        employee_id: filterId, 
        status, 
        movement_type, 
        department: filterDept, 
        pagination 
      });
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
      return await movementService.updateMovement(id, input, institution_id, ctx.user.id);
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
