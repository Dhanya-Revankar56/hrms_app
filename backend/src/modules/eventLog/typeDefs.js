const { gql } = require("apollo-server-express");
const { GraphQLJSON } = require('graphql-type-json');

const typeDefs = gql`
  scalar JSON

  type EventLog {
    id: ID!
    user_id: String
    user_name: String
    user_role: String
    action_type: String!
    module_name: String
    record_id: String
    description: String
    old_data: JSON
    new_data: JSON
    ip_address: String
    timestamp: String
  }

  type EventLogPage {
    items: [EventLog!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    eventLogs(
      module_name: String
      action_type: String
      user_id: String
      date_from: String
      date_to: String
      pagination: PaginationInput
    ): EventLogPage!
  }
`;

module.exports = typeDefs;
