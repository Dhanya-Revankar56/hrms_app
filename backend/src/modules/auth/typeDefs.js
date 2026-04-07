const { gql } = require("apollo-server-express");

const authTypeDefs = gql`
  type LoginResponse {
    token: String!
    user: AuthUser!
  }

  type AuthUser {
    id: ID!
    email: String!
    name: String
    role: String!
    tenant_id: String
    tenant_code: String
  }

  extend type Mutation {
    login(email: String!, password: String!): LoginResponse!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!
  }
`;

module.exports = authTypeDefs;
