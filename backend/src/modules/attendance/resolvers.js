const attendanceService = require("./service");
const employeeService = require("../employee/service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    attendances: async (_, { employee_id, status, from_date, to_date, pagination }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await attendanceService.listAttendance({ institution_id, employee_id, status, from_date, to_date, pagination });
    },
    attendance: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await attendanceService.getAttendanceById(id, institution_id);
    },
  },

  Mutation: {
    createAttendance: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await attendanceService.createAttendance({ ...input, institution_id });
    },
    updateAttendance: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await attendanceService.updateAttendance(id, input, institution_id);
    },
    deleteAttendance: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await attendanceService.deleteAttendance(id, institution_id);
    },
  },

  Attendance: {
    id: (parent) => parent._id?.toString() || parent.id,
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      return await employeeService.getEmployeeById(parent.employee_id, parent.institution_id);
    },
  },
};

module.exports = resolvers;
