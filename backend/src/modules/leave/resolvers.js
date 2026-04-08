const leaveService = require("./service");
const Employee = require("../employee/model");
const employeeService = require("../employee/service");
const { requireRole } = require("../../middleware/auth");

// 🛡 Multi-Tenant Leave Resolvers
const resolvers = {
  Query: {
    leaves: async (_, { employee_id, status, leave_type, department, search, month, year, pagination }, ctx) => {
      const role = ctx.user?.role;
      let filterId = employee_id;
      let filterDept = department;

      if (role === "EMPLOYEE") {
        const empRecord = await Employee.findOne({ user_id: ctx.user.id }).select("_id").lean();
        filterId = empRecord?._id;
      } else if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("work_detail.department")
          .lean();
        filterDept = hodRecord?.work_detail?.department?.toString();
      }

      return await leaveService.listLeaves({ 
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
      return await leaveService.getLeaveById(id);
    },
    leaveBalances: async (_, { employee_id }, ctx) => {
      const role = ctx.user?.role;
      const targetId = (role === "EMPLOYEE") ? ctx.user.id : employee_id;
      return await leaveService.listLeaveBalances(targetId);
    },
  },

  Mutation: {
    applyLeave: async (_, { input }, ctx) => {
      return await leaveService.applyLeave(input, ctx);
    },
    updateLeaveApproval: async (_, { id, role, status, remarks }, ctx) => {
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT"]);
      return await leaveService.updateLeaveApproval({ id, role, status, remarks, user_id: ctx.user.id });
    },
    cancelLeave: async (_, { id }, ctx) => {
      return await leaveService.cancelLeave(id, ctx);
    },
    createLeave: async (_, { input }, ctx) => {
      return await leaveService.createLeave(input, ctx);
    },
    updateLeave: async (_, { id, input }, ctx) => {
      // NOTE: Leave service expects (id, data, institution_id, user_id) 
      // But institution_id is deprecated. We can pass null or undefined and tenantPlugin will handle scoping.
      return await leaveService.updateLeave(id, input, null, ctx?.user?.id);
    },
    deleteLeave: async (_, { id }, ctx) => {
      return await leaveService.deleteLeave(id, ctx);
    },
  },

  Leave: {
    id: (parent) => parent._id?.toString() || parent.id,
    tenant_id: (parent) => parent.tenant_id?.toString() || parent.institution_id,
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      try {
        return await employeeService.getEmployeeById(parent.employee_id);
      } catch (err) {
        return null;
      }
    },
  },

  LeaveBalance: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
};

module.exports = resolvers;
