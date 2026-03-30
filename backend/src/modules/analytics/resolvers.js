const analyticsService = require("./service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    hrAnalytics: async (_, __, ctx) => {
      const institution_id = requireTenant(ctx);
      return await analyticsService.getHrAnalytics(institution_id);
    },
  },
};

module.exports = resolvers;
