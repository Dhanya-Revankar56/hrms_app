const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Holiday {
    id: ID!
    tenant_id: String
    institution_id: String
    name: String!
    date: String!
    type: String
    description: String
    is_active: Boolean
    created_at: String
    updated_at: String
  }

  input CreateHolidayInput {
    name: String!
    date: String!
    type: String
    description: String
    is_active: Boolean
  }

  input UpdateHolidayInput {
    name: String
    date: String
    type: String
    description: String
    is_active: Boolean
  }

  extend type Query {
    holidays(year: Int, month: Int): [Holiday!]!
    holiday(id: ID!): Holiday
  }

  extend type Mutation {
    createHoliday(input: CreateHolidayInput!): Holiday!
    updateHoliday(id: ID!, input: UpdateHolidayInput!): Holiday!
    deleteHoliday(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
