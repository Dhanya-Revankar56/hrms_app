const { gql } = require("apollo-server-express");

const tenantTypeDefs = gql`
  type Tenant {
    id: ID!
    name: String!
    code: String!
  }

  extend type Query {
    publicTenants: [Tenant!]!
  }
`;

module.exports = tenantTypeDefs;
