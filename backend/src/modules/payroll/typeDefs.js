const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Earnings {
    basic: Float
    agp: Float
    da: Float
    hra: Float
  }

  type SalaryRecord {
    id: ID!
    employee_id: ID!
    monthly_ctc: Float
    annual_ctc: Float
    net_monthly_salary: Float
    net_annual_salary: Float
    earnings: Earnings
    effective_from: String
    status: String
  }

  type Payslip {
    id: ID!
    employee_id: ID!
    month: String
    amount: Float
    pdf_url: String
    status: String
    created_at: String
  }

  input EarningsInput {
    basic: Float
    agp: Float
    da: Float
    hra: Float
  }

  input UpdateSalaryInput {
    monthly_ctc: Float
    annual_ctc: Float
    net_monthly_salary: Float
    net_annual_salary: Float
    earnings: EarningsInput
    effective_from: String
  }

  type PayslipPage {
    items: [Payslip!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    salaryRecord(employee_id: ID!): SalaryRecord
    payslips(employee_id: ID!, pagination: PaginationInput): PayslipPage!
  }

  extend type Mutation {
    updateSalaryRecord(employee_id: ID!, input: UpdateSalaryInput!): SalaryRecord!
    generatePayslip(employee_id: ID!, month: String!, amount: Float!): Payslip!
  }
`;

module.exports = typeDefs;
