const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Attendance {
    id: ID!
    institution_id: String!
    employee_id: String!
    employee_code: String
    employee: Employee
    date: String!
    check_in: String
    check_out: String
    status: String
    working_hours: Float
    overtime_hours: Float
    note: String
    marked_by: String
    created_at: String
    updated_at: String
  }

  input CreateAttendanceInput {
    employee_id: String!
    employee_code: String
    date: String!
    check_in: String
    check_out: String
    status: String
    working_hours: Float
    overtime_hours: Float
    note: String
    marked_by: String
  }

  input UpdateAttendanceInput {
    check_in: String
    check_out: String
    status: String
    working_hours: Float
    overtime_hours: Float
    note: String
  }

  type AttendancePage {
    items: [Attendance!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    attendances(employee_id: String, status: String, from_date: String, to_date: String, pagination: PaginationInput): AttendancePage!
    attendance(id: ID!): Attendance
  }

  extend type Mutation {
    createAttendance(input: CreateAttendanceInput!): Attendance!
    updateAttendance(id: ID!, input: UpdateAttendanceInput!): Attendance!
    deleteAttendance(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
