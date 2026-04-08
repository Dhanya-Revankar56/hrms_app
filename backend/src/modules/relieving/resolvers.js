const relievingService = require("./service");
const Employee = require("../employee/model");
const employeeService = require("../employee/service");

// 🛡 Multi-Tenant Relieving Resolvers
const resolvers = {
  Query: {
    relievings: async (_, { employee_id, status, department, pagination }, ctx) => {
      const role = ctx.user?.role;
      let filterId = employee_id;
      let filterDept = department;

      if (role === "EMPLOYEE") {
        const empRecord = await Employee.findOne({ user_id: ctx.user.id }).select("_id").lean();
        filterId = empRecord?._id;
      } else if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("_id work_detail.department")
          .lean();
        filterId = employee_id; // Keep if passed, otherwise none
        filterDept = hodRecord?.work_detail?.department?.toString();
      }

      return await relievingService.listRelievings({ 
        employee_id: filterId, 
        status, 
        department: filterDept, 
        pagination 
      });
    },
    relieving: async (_, { id }, ctx) => {
      return await relievingService.getRelievingById(id);
    },
  },

  Mutation: {
    createRelieving: async (_, { input }, ctx) => {
      return await relievingService.createRelieving(input);
    },
    updateRelieving: async (_, { id, input }, ctx) => {
      return await relievingService.updateRelieving(id, input);
    },
    deleteRelieving: async (_, { id }, ctx) => {
      return await relievingService.deleteRelieving(id);
    },
  },

  Relieving: {
    id: (parent) => parent._id?.toString() || parent.id,
    tenant_id: (parent) => parent.tenant_id?.toString() || parent.institution_id,
    employee_id: (parent) => {
      if (!parent.employee_id) return null;
      return typeof parent.employee_id === 'object' ? (parent.employee_id._id?.toString() || parent.employee_id.id) : parent.employee_id.toString();
    },
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      // If already populated by .populate('employee_id') in service
      if (parent.employee_id._id || parent.employee_id.first_name) {
        return parent.employee_id;
      }
      return await employeeService.getEmployeeById(parent.employee_id);
    },
  },
};

module.exports = resolvers;
