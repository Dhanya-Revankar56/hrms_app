const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type LeaveApproval {
    role: String!
    status: String!
    updated_at: String
    updated_by: String
    remarks: String
  }

  type Leave {
    id: ID!
    institution_id: String!
    employee_id: String!
    employee_code: String
    employee: Employee
    leave_type: String!
    from_date: String!
    to_date: String!
    total_days: Float
    reason: String
    status: String
    
    approvals: [LeaveApproval]
    
    requested_date: String
    is_half_day: Boolean
    half_day_type: String
    document_url: String
    created_at: String
    updated_at: String
  }

  type LeaveBalance {
    id: ID!
    employee_id: String!
    leave_type: String!
    total: Float
    used: Float
    balance: Float
  }

  input ApplyLeaveInput {
    employee_id: String!
    leave_type: String!
    from_date: String!
    to_date: String!
    reason: String
    is_half_day: Boolean
    half_day_type: String
    document_url: String
  }

  input CreateLeaveInput {
    employee_id: String!
    employee_code: String
    leave_type: String!
    from_date: String!
    to_date: String!
    total_days: Float
    reason: String
    is_half_day: Boolean
    half_day_type: String
    document_url: String
  }

  input UpdateLeaveInput {
    status: String
    leave_type: String
    from_date: String
    to_date: String
    total_days: Float
    reason: String
  }

  type LeavePage {
    items: [Leave!]!
    pageInfo: PageInfo!
    pendingCount: Int
    approvedCount: Int
    rejectedCount: Int
    filteredTotalCount: Int
  }

  extend type Query {
    leaves(employee_id: String, status: String, leave_type: String, department: String, search: String, month: Int, year: Int, pagination: PaginationInput): LeavePage!
    leave(id: ID!): Leave
    leaveBalances(employee_id: String!): [LeaveBalance!]!
  }

  extend type Mutation {
    applyLeave(input: ApplyLeaveInput!): Leave!
    updateLeaveApproval(id: ID!, role: String!, status: String!, remarks: String): Leave!
    cancelLeave(id: ID!): Leave!
    
    createLeave(input: CreateLeaveInput!): Leave!
    updateLeave(id: ID!, input: UpdateLeaveInput!): Leave!
    deleteLeave(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
