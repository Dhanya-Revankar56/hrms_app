const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Relieving {
    id: ID!
    institution_id: String!
    employee_id: String!
    employee_code: String
    resignation_date: String!
    last_working_date: String!
    notice_period_days: Int
    reason: String
    status: String
    exit_interview_done: Boolean
    assets_returned: Boolean
    relieve_letter_path: String
    remarks: String
    employee: Employee
    created_at: String
    updated_at: String
  }

  input CreateRelievingInput {
    employee_id: String!
    employee_code: String
    resignation_date: String!
    last_working_date: String!
    notice_period_days: Int
    reason: String
  }

  input UpdateRelievingInput {
    status: String
    exit_interview_done: Boolean
    assets_returned: Boolean
    relieve_letter_path: String
    remarks: String
    last_working_date: String
    notice_period_days: Int
  }

  type RelievingPage {
    items: [Relieving!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    relievings(employee_id: String, status: String, pagination: PaginationInput): RelievingPage!
    relieving(id: ID!): Relieving
  }

  extend type Mutation {
    createRelieving(input: CreateRelievingInput!): Relieving!
    updateRelieving(id: ID!, input: UpdateRelievingInput!): Relieving!
    deleteRelieving(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
