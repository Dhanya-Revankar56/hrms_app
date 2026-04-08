const Employee = require("./model");
const employeeService = require("./service");
const { requireRole } = require("../../middleware/auth");
const { withTenant } = require("../../utils/tenantUtils");

// 🛡 Multi-Tenant Employee Resolvers
const resolvers = {
  Query: {
    getAllEmployees: async (_, { status, department, search, pagination }, ctx) => {
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT", "EMPLOYEE"]);

      const role = ctx.user?.role;
      const userId = ctx.user?.id;

      // 🛡 HOD or EMPLOYEE → restrict to their own department
      let filterDepartment = department; 
      if (role === "HEAD OF DEPARTMENT" || role === "EMPLOYEE") {
        const empRecord = await Employee.findOne(withTenant({ user_id: userId }))
          .select("work_detail.department")
          .lean();
        const deptId = empRecord?.work_detail?.department?.toString();
        filterDepartment = deptId || null;
      }

      // 🏰 ADMIN (all) or HOD/EMPLOYEE (department only)
      return await employeeService.listEmployees({
        status,
        department: filterDepartment,
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
      return await employeeService.createEmployee(input, ctx);
    },

    updateEmployee: async (_, { id, input }, ctx) => {
      return await employeeService.updateEmployee(id, input, ctx);
    },

    deleteEmployee: async (_, { id }, ctx) => {
      requireRole(ctx.user, ["ADMIN"]);
      return await employeeService.deleteEmployee(id, ctx);
    },

    reHireEmployee: async (_, { id }, ctx) => {
      requireRole(ctx.user, ["ADMIN"]);
      return await employeeService.reHireEmployee(id, ctx);
    },
  },

  Employee: {
    id: (parent) => parent._id.toString(),
    institution_id: (parent) => parent.institution_id || parent.tenant_id?.toString() || "",
    first_name: (parent) => {
      if (parent.first_name) return parent.first_name;
      if (parent.name) return parent.name.split(" ")[0];
      return "";
    },
    last_name: (parent) => {
      if (parent.last_name) return parent.last_name;
      if (parent.name) {
        const parts = parent.name.split(" ");
        return parts.length > 1 ? parts.slice(1).join(" ") : "";
      }
      return "";
    },
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
