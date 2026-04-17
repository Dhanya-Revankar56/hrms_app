const attendanceService = require("./service");
const employeeService = require("../employee/service");

// 🛡 Multi-Tenant Attendance Resolvers
const resolvers = {
  Query: {
    attendances: async (
      _,
      { employee_id, status, from_date, to_date, pagination },
      ctx,
    ) => {
      const role = ctx.user?.role;
      let filterId = employee_id;

      if (role === "EMPLOYEE") {
        const Employee = require("../employee/model");
        const empRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("_id")
          .lean();
        filterId = empRecord?._id || ctx.user.id;
      }

      return await attendanceService.listAttendance({
        employee_id: filterId,
        status,
        from_date,
        to_date,
        pagination,
      });
    },
    attendance: async (_, { id }, _ctx) => {
      return await attendanceService.getAttendanceById(id);
    },
  },

  Mutation: {
    createAttendance: async (_, { input }, _ctx) => {
      return await attendanceService.createAttendance(input);
    },
    updateAttendance: async (_, { id, input }, _ctx) => {
      return await attendanceService.updateAttendance(id, input);
    },
    deleteAttendance: async (_, { id }, _ctx) => {
      return await attendanceService.deleteAttendance(id);
    },
  },

  Attendance: {
    id: (parent) => parent._id?.toString() || parent.id,
    employee: async (parent) => {
      if (!parent.employee_id) return null;
      return await employeeService.getEmployeeById(parent.employee_id);
    },
  },
};

module.exports = resolvers;
