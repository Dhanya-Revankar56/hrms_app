const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type PersonalDetail {
    date_of_birth: String
    gender: String
    marital_status: String
    blood_group: String
    aadhar_no: String
    pan_no: String
    pf_no: String
    esic_no: String
  }

  type Department {
    id: ID!
    name: String!
    short_name: String
  }

  type Designation {
    id: ID!
    name: String!
    short_name: String
    department: Department
  }

  type WorkDetail {
    date_of_joining: String
    designation: Designation
    department: Department
    employee_type: String
    reporting_to: ID
  }

  type Address {
    city: String
    state: String
    country: String
    pin_code: String
  }

  type BankDetail {
    bank_name: String
    account_no: String
    ifsc: String
    bank_type: String
  }

  type Employee {
    id: ID!
    institution_id: String!
    employee_id: String
    first_name: String!
    last_name: String!
    user_email: String!
    user_contact: String
    employee_image: String
    personal_detail: PersonalDetail
    work_detail: WorkDetail
    bank_detail: [BankDetail]
    app_status: String
    app_role: String
    is_active: Boolean
    reporting_to: ID
    created_at: String
    updated_at: String
    created_by: ID
    updated_by: ID
  }

  input PersonalDetailInput {
    date_of_birth: String
    gender: String
    marital_status: String
    blood_group: String
    aadhar_no: String
    pan_no: String
    pf_no: String
    esic_no: String
  }

  input WorkDetailInput {
    date_of_joining: String
    designation: String
    department: String
    employee_type: String
    reporting_to: ID
  }

  input AddressInput {
    address_line1: String
    address_line2: String
    city: String
    state: String
    country: String
    pin_code: String
  }

  input BankDetailInput {
    bank_name: String
    account_no: String
    ifsc: String
    bank_type: String
  }

  input CreateEmployeeInput {
    first_name: String!
    last_name: String!
    user_email: String!
    user_contact: String
    employee_image: String
    personal_detail: PersonalDetailInput
    work_detail: WorkDetailInput
    bank_detail: [BankDetailInput]
    app_role: String
    reporting_to: ID
  }

  input UpdateEmployeeInput {
    first_name: String
    last_name: String
    user_email: String
    user_contact: String
    employee_image: String
    personal_detail: PersonalDetailInput
    work_detail: WorkDetailInput
    bank_detail: [BankDetailInput]
    app_status: String
    app_role: String
    is_active: Boolean
    reporting_to: ID
  }

  type EmployeePage {
    items: [Employee!]!
    pageInfo: PageInfo!
    activeCount: Int!
    onLeaveCount: Int!
  }

  extend type Query {
    getAllEmployees(status: String, department: String, search: String, pagination: PaginationInput): EmployeePage!
    employee(id: ID!): Employee
  }

  extend type Mutation {
    createEmployee(input: CreateEmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployee(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
