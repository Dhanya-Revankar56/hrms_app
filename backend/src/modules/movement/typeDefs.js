const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Movement {
    id: ID!
    institution_id: String!
    employee_id: String!
    employee_code: String
    employee: Employee
    movement_type: String!
    from_location: String
    to_location: String
    purpose: String
    movement_date: String!
    out_time: String
    in_time: String
    status: String
    dept_admin_status: String
    dept_admin_id: String
    dept_admin_date: String
    dept_admin_remarks: String
    admin_status: String
    admin_id: String
    admin_date: String
    admin_remarks: String
    remarks: String
    created_at: String
    updated_at: String
  }

  input CreateMovementInput {
    employee_id: String!
    employee_code: String
    movement_type: String!
    from_location: String
    to_location: String
    purpose: String
    movement_date: String!
    out_time: String
    in_time: String
  }

  input UpdateMovementInput {
    purpose: String
    dept_admin_status: String
    dept_admin_remarks: String
    admin_status: String
    admin_remarks: String
    remarks: String
    in_time: String
    out_time: String
    from_location: String
    to_location: String
    status: String
  }

  type MovementPage {
    items: [Movement!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    movements(employee_id: String, status: String, movement_type: String, pagination: PaginationInput): MovementPage!
    movement(id: ID!): Movement
  }

  extend type Mutation {
    createMovement(input: CreateMovementInput!): Movement!
    updateMovement(id: ID!, input: UpdateMovementInput!): Movement!
    deleteMovement(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
