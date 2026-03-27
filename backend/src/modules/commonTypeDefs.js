const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar JSON

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

  type PageInfo {
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

module.exports = typeDefs;
