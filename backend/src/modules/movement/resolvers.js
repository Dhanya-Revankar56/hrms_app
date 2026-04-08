const movementService = require("./service");
const Employee = require("../employee/model");
const employeeService = require("../employee/service");

// 🛡 Multi-Tenant Movement Resolvers
const resolvers = {
  Query: {
    movements: async (
      _,
      { employee_id, status, movement_type, department, pagination },
      ctx,
    ) => {
      const role = ctx.user?.role;
      let filterId = employee_id;
      let filterDept = department;

      if (role === "EMPLOYEE") {
        const empRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("_id")
          .lean();
        filterId = empRecord?._id || ctx.user.id; // Fallback to user_id if employee record missing
      } else if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("work_detail.department")
          .lean();
        // Only override if HOD has a department; otherwise allow passed department
        if (hodRecord?.work_detail?.department) {
          filterDept = hodRecord.work_detail.department.toString();
        }
      }

      return await movementService.listMovements({
        employee_id: filterId,
        status,
        movement_type,
        department: filterDept,
        pagination,
      });
    },
    movement: async (_, { id }, _ctx) => {
      return await movementService.getMovementById(id);
    },
  },

  Mutation: {
    createMovement: async (_, { input }, ctx) => {
      return await movementService.createMovement(input, ctx);
    },
    updateMovement: async (_, { id, input }, ctx) => {
      return await movementService.updateMovement(id, input, ctx);
    },
    deleteMovement: async (_, { id }, ctx) => {
      return await movementService.deleteMovement(id, ctx);
    },
  },

  Movement: {
    id: (parent) => parent._id?.toString() || parent.id,
    tenant_id: (parent) =>
      parent.tenant_id?.toString() || parent.institution_id,
    movement_date: (parent) => {
      if (!parent.movement_date) return null;
      try {
        return new Date(parent.movement_date).toISOString();
      } catch (__) {
        return parent.movement_date;
      }
    },
    employee: async (parent) => {
      if (parent.employee && parent.employee._id) return parent.employee;
      if (!parent.employee_id) return null;
      try {
        return await employeeService.getEmployeeById(parent.employee_id);
      } catch (_err) {
        return null;
      }
    },
  },
};

module.exports = resolvers;
