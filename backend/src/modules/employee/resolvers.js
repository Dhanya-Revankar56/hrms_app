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
      requireRole(ctx.user, ["ADMIN", "HEAD OF DEPARTMENT", "EMPLOYEE"]);

      const role = ctx.user?.role; // "ADMIN" | "HEAD OF DEPARTMENT" | "EMPLOYEE"

      // EMPLOYEE → return only their own record wrapped in page shape
      if (role === "EMPLOYEE") {
        const self = await Employee.findOne({ _id: ctx.user.id, institution_id })
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

      // HOD → restrict to their own department (DB lookup — no JWT change needed)
      let hodDepartment = department; // may still be overridden by their dept
      if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ _id: ctx.user.id, institution_id })
          .select("work_detail.department")
          .lean();
        const hodDeptId = hodRecord?.work_detail?.department?.toString();
        // If HOD tries to filter another dept, ignore — always lock to own dept
        hodDepartment = hodDeptId || null;
      }

      // ADMIN or HOD with resolved department
      return await employeeService.listEmployees({
        institution_id,
        status,
        department: role === "HEAD OF DEPARTMENT" ? hodDepartment : department,
        search,
        pagination,
      });
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
