const analyticsService = require("./service");

// 🛡 Multi-Tenant Analytics Resolvers
const resolvers = {
  Query: {
    hrAnalytics: async (_, __, ctx) => {
      return await analyticsService.getHrAnalytics(ctx.user);
    },
  },
};

module.exports = resolvers;
