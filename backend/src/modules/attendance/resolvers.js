const attendanceService = require("./service");
const employeeService = require("../employee/service");

// 🛡 Multi-Tenant Attendance Resolvers
const resolvers = {
  Query: {
    attendances: async (
      _,
      { employee_id, status, from_date, to_date, pagination },
      _ctx,
    ) => {
      return await attendanceService.listAttendance({
        employee_id,
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
