const Employee = require("./model");
const employeeService = require("./service");
const { requireRole } = require("../../middleware/auth");

// 🛡 Multi-Tenant Employee Resolvers
const resolvers = {
  Query: {
    getAllEmployees: async (_, { status, department, search, pagination }, ctx) => {
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT", "EMPLOYEE"]);

      const role = ctx.user?.role; // "ADMIN" | "HEAD OF DEPARTMENT" | "EMPLOYEE"

      // 👤 EMPLOYEE → return only their own record
      if (role === "EMPLOYEE") {
        const self = await Employee.findOne({ user_id: ctx.user.id }) 
          .populate("work_detail.department")
          .populate("work_detail.designation")
          .lean();
        const items = self ? [self] : [];
        return {
          items,
          pageInfo: { totalCount: items.length, totalPages: 1, currentPage: 1, hasNextPage: false },
          activeCount: self?.app_status === "active" ? 1 : 0,
          onLeaveCount: self?.app_status === "on-leave" ? 1 : 0,
        };
      }

      // 🛡 HOD → restrict to their own department
      let hodDepartment = department; 
      if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("work_detail.department")
          .lean();
        const hodDeptId = hodRecord?.work_detail?.department?.toString();
        hodDepartment = hodDeptId || null;
      }

      // 🏰 ADMIN or HOD with resolved department
      return await employeeService.listEmployees({
        status,
        department: hodDepartment,
        search,
        pagination
      });
    },

    employee: async (_, { id }, ctx) => {
      // 🛡 Data-level restriction: Employee can only access their own data
      if (ctx.user && ctx.user.role === "EMPLOYEE" && ctx.user.id !== id) {
        throw new Error("You are only authorized to view your own profile");
      }
      return await employeeService.getEmployeeById(id);
    },
  },

  Mutation: {
    createEmployee: async (_, { input }, ctx) => {
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT"]);
      return await employeeService.createEmployee(input);
    },

    updateEmployee: async (_, { id, input }, ctx) => {
      return await employeeService.updateEmployee(id, input);
    },

    deleteEmployee: async (_, { id }, ctx) => {
      requireRole(ctx.user, ["ADMIN"]);
      return await employeeService.deleteEmployee(id);
    },
  },

  Employee: {
    id: (parent) => parent._id.toString(),
    reporting_to: (parent) => parent.reporting_to ? parent.reporting_to.toString() : null,
    app_status: (parent) => parent.status || "active",
    user_email: async (parent) => {
      if (parent.user_email) return parent.user_email;
      const User = require("../auth/user.model");
      const user = await User.findById(parent.user_id).lean();
      return user ? user.email : "unknown@domain.com";
    },
    app_role: async (parent) => {
      if (parent.app_role) return parent.app_role;
      const User = require("../auth/user.model");
      const user = await User.findById(parent.user_id).lean();
      return user ? user.role : "EMPLOYEE";
    },
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
