const Employee = require("./model");
const employeeService = require("./service");
const { requireRole } = require("../../middleware/auth");

// Helper: throw error if institution_id missing from context
const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header. All requests must include an institution ID.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    getAllEmployees: async (_, { status, department, search, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT"]);
      return await employeeService.listEmployees({ institution_id, status, department, search, pagination });
    },

    employee: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      
      // 🛡 Data-level restriction: Employee can only access their own data
      if (ctx.user && ctx.user.role === "EMPLOYEE" && ctx.user.id !== id) {
        throw new Error("You are only authorized to view your own profile");
      }
      
      return await employeeService.getEmployeeById(id, institution_id);
    },
  },

  Mutation: {
    createEmployee: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT"]);
      return await employeeService.createEmployee({ ...input, institution_id });
    },

    updateEmployee: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await employeeService.updateEmployee(id, input, institution_id);
    },

    deleteEmployee: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      requireRole(ctx.user, ["ADMIN"]);
      return await employeeService.deleteEmployee(id, institution_id);
    },
  },

  Employee: {
    id: (parent) => parent._id.toString(),
    reporting_to: (parent) => parent.reporting_to ? parent.reporting_to.toString() : null,
    work_detail: async (parent) => {
      if (!parent.work_detail) return null;
      // Populate if they are IDs
      const populated = await Employee.findById(parent._id)
        .populate("work_detail.department")
        .populate("work_detail.designation")
        .lean();
      
      const wd = populated.work_detail;
      return {
        ...wd,
        department: wd.department ? { ...wd.department, id: wd.department._id.toString() } : null,
        designation: wd.designation ? { ...wd.designation, id: wd.designation._id.toString() } : null,
      };
    }
  },
  
  Department: {
    id: (parent) => parent._id?.toString() || parent.id
  },

  Designation: {
    id: (parent) => parent._id?.toString() || parent.id
  }
};

module.exports = resolvers;
