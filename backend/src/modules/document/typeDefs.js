const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type EmployeeDocument {
    id: ID!
    employee_id: ID!
    name: String!
    file_url: String!
    file_type: String
    status: String
    created_at: String
  }

  extend type Query {
    employeeDocuments(employee_id: ID!): [EmployeeDocument!]!
  }

  extend type Mutation {
    uploadDocument(employee_id: ID!, name: String!, file_url: String!, file_type: String): EmployeeDocument!
    deleteDocument(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
