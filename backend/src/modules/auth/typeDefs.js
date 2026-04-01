const { gql } = require("apollo-server-express");

const authTypeDefs = gql`
  type LoginResponse {
    token: String!
    user: AuthUser!
  }

  type AuthUser {
    id: ID!
    email: String!
    name: String!
    role: String!
    institution_id: String!
  }

  extend type Mutation {
    login(email: String!, password: String!): LoginResponse!
  }
`;

module.exports = authTypeDefs;
