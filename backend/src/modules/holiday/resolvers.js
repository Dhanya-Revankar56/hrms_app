const holidayService = require("./service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    holidays: async (_, { year, month }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await holidayService.listHolidays({ institution_id, year, month });
    },
    holiday: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await holidayService.getHolidayById(id, institution_id);
    },
  },

  Mutation: {
    createHoliday: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await holidayService.createHoliday({ ...input, institution_id });
    },
    updateHoliday: async (_, { id, input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await holidayService.updateHoliday(id, input, institution_id);
    },
    deleteHoliday: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await holidayService.deleteHoliday(id, institution_id);
    },
  },

  Holiday: {
    id: (parent) => parent._id?.toString() || parent.id,
    date: (parent) => (parent.date instanceof Date ? parent.date.toISOString() : parent.date),
  },
};

module.exports = resolvers;
