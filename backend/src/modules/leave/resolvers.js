const leaveService = require("./service");
const Employee = require("../employee/model");
const employeeService = require("../employee/service");
const { requireRole } = require("../../middleware/auth");

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

      return await leaveService.listLeaves({ 
        institution_id, 
        employee_id: filterId, 
        status, 
        leave_type, 
        department: filterDept, 
        search, 
        month, 
        year, 
        pagination 
      });
    },
    leave: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.getLeaveById(id, institution_id);
    },
    leaveBalances: async (_, { employee_id }, ctx) => {
      const institution_id = requireTenant(ctx);
      const role = ctx.user?.role;
      const targetId = (role === "EMPLOYEE") ? ctx.user.id : employee_id;
      
      return await leaveService.listLeaveBalances(targetId, institution_id);
    },
  },

  Mutation: {
    applyLeave: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await leaveService.applyLeave({ ...input, institution_id });
    },
    updateLeaveApproval: async (_, { id, role, status, remarks }, ctx) => {
      const institution_id = requireTenant(ctx);
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT"]);
      return await leaveService.updateLeaveApproval({ id, role, status, remarks, institution_id, user_id: ctx.user.id });
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
      return await leaveService.updateLeave(id, input, institution_id, ctx.user.id);
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
