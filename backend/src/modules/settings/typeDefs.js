const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type MasterDataItem {
    id: ID!
    name: String!
    short_name: String
    description: String
    is_active: Boolean
    created_by: ID
    updated_by: ID
    created_at: String
    updated_at: String
  }

  type Address {
    line1: String
    line2: String
    city: String
    state: String
    country: String
    pin_code: String
  }

  type LeaveType {
    id: ID!
    name: String!
    code: String
    total_days: Int
    max_per_request: Int
    max_consecutive_leaves: Int
    days_before_apply: Int
    max_consecutive_days: Int
    weekends_covered: Boolean
    holiday_covered: Boolean
    user_entry: Boolean
    balance_enabled: Boolean
    workload_interchange: Boolean
    document_required: Boolean
    leave_category: String
    applicable_for: [String]
    reset_cycle: String
    description: String
    is_active: Boolean
    created_by: ID
    updated_by: ID
    created_at: String
    updated_at: String
  }

  type MovementSettings {
    limit_count: Int
    limit_frequency: String
    max_duration_mins: Int
    days_before_apply: Int
    user_entry: Boolean
    limit_enabled: Boolean
  }

  type Settings {
    id: ID!
    tenant_id: String
    institution_id: String
    institution_name: String
    institution_short_name: String
    institution_code: String
    institution_logo: String
    owner_name: String
    added_by: ID
    pan_number: String
    registration_number: String
    website_url: String
    fax_number: String
    contact_email: String
    contact_phone: String
    contact_mobile: String
    address: Address
    working_days: [String]
    working_hours: WorkingHours
    notice_period_days: Int
    employee_id_prefix: String
    timezone: String
    departments: [MasterDataItem]
    designations: [MasterDataItem]
    leave_types: [LeaveType]
    employee_categories: [MasterDataItem]
    employee_types: [MasterDataItem]
    movement_settings: MovementSettings
    created_at: String
    updated_at: String
  }

  input UpsertMasterDataInput {
    id: ID
    name: String!
    short_name: String
    description: String
    is_active: Boolean
    created_by: ID
    updated_by: ID
  }

  input UpsertLeaveTypeInput {
    id: ID
    name: String!
    code: String
    total_days: Int
    max_per_request: Int
    max_consecutive_leaves: Int
    days_before_apply: Int
    max_consecutive_days: Int
    weekends_covered: Boolean
    holiday_covered: Boolean
    user_entry: Boolean
    balance_enabled: Boolean
    workload_interchange: Boolean
    document_required: Boolean
    leave_category: String
    applicable_for: [String]
    reset_cycle: String
    description: String
    is_active: Boolean
    created_by: ID
    updated_by: ID
  }

  input AddressInput {
    line1: String
    line2: String
    city: String
    state: String
    country: String
    pin_code: String
  }

  type UpcomingHoliday {
    id: ID!
    name: String!
    date: String!
    type: String
    description: String
  }

  type OnLeaveEmployee {
    id: ID!
    name: String
    department: String
    leave_type: String
  }

  type DashboardStats {
    totalEmployees: Int
    onLeaveToday: Int
    onLeaveEmployees: [OnLeaveEmployee]
    presentToday: Int
    absentToday: Int
    pendingApprovals: Int
    pendingLeaves: Int
    pendingMovements: Int
    upcomingHolidays: [UpcomingHoliday]
  }

  extend type Query {
    settings: Settings
    dashboardStats: DashboardStats
  }

  input UpdateSettingsInput {
    institution_name: String
    institution_short_name: String
    institution_code: String
    institution_logo: String
    owner_name: String
    pan_number: String
    registration_number: String
    website_url: String
    fax_number: String
    contact_email: String
    contact_phone: String
    contact_mobile: String
    address: AddressInput
    working_days: [String]
    working_hours: WorkingHoursInput
    notice_period_days: Int
    employee_id_prefix: String
    timezone: String
    movement_settings: UpdateMovementSettingsInput
  }

  input UpdateMovementSettingsInput {
    limit_count: Int
    limit_frequency: String
    max_duration_mins: Int
    days_before_apply: Int
    user_entry: Boolean
    limit_enabled: Boolean
  }

  input WorkingHoursInput {
    start: String
    end: String
  }

  type WorkingHours {
    start: String
    end: String
  }

  extend type Mutation {
    upsertSettings(input: UpdateSettingsInput!): Settings!
    upsertDepartment(input: UpsertMasterDataInput!): MasterDataItem!
    deleteDepartment(id: ID!): Boolean
    upsertDesignation(input: UpsertMasterDataInput!): MasterDataItem!
    deleteDesignation(id: ID!): Boolean
    upsertLeaveType(input: UpsertLeaveTypeInput!): LeaveType!
    deleteLeaveType(id: ID!): Boolean
    upsertEmployeeCategory(input: UpsertMasterDataInput!): MasterDataItem!
    deleteEmployeeCategory(id: ID!): Boolean
    upsertEmployeeType(input: UpsertMasterDataInput!): MasterDataItem!
    deleteEmployeeType(id: ID!): Boolean
  }
`;

module.exports = typeDefs;
