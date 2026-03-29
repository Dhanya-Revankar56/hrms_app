const eventLogService = require("./service");
const { GraphQLJSON } = require('graphql-type-json');

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    eventLogs: async (_, args, ctx) => {
      const institution_id = requireTenant(ctx);
      return await eventLogService.listEventLogs({ ...args, institution_id });
    }
  },
  EventLog: {
    id: (parent) => parent._id?.toString() || parent.id
  }
};

module.exports = resolvers;
