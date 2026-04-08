const holidayService = require("./service");

// 🛡 Multi-Tenant Holiday Resolvers
const resolvers = {
  Query: {
    holidays: async (_, { year, month }, _ctx) => {
      const result = await holidayService.listHolidays({ year, month });
      return result.items || [];
    },
    holiday: async (_, { id }, _ctx) => {
      return await holidayService.getHolidayById(id);
    },
  },

  Mutation: {
    createHoliday: async (_, { input }, ctx) => {
      return await holidayService.createHoliday(input, ctx);
    },
    updateHoliday: async (_, { id, input }, ctx) => {
      return await holidayService.updateHoliday(id, input, ctx);
    },
    deleteHoliday: async (_, { id }, ctx) => {
      return await holidayService.deleteHoliday(id, ctx);
    },
  },

  Holiday: {
    id: (parent) => parent._id?.toString() || parent.id,
    tenant_id: (parent) =>
      parent.tenant_id?.toString() || parent.institution_id,
    date: (parent) => {
      const dt = parent.date || parent.holiday_date;
      return dt instanceof Date ? dt.toISOString() : dt;
    },
  },
};

module.exports = resolvers;
