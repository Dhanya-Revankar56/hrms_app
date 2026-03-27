import { gql } from "@apollo/client";

export const GET_SETTINGS = gql`
  query GetSettings {
    settings {
      id
      institution_name
      institution_short_name
      institution_code
      owner_name
      added_by
      pan_number
      registration_number
      website_url
      fax_number
      contact_email
      contact_phone
      contact_mobile
      address {
        line1
        line2
        city
        state
        country
        pin_code
      }
      working_days
      departments { id name short_name description }
      designations { id name short_name description }
      leave_types { id name code total_days max_per_request max_consecutive_leaves days_before_apply max_consecutive_days weekends_covered holiday_covered user_entry balance_enabled workload_interchange document_required leave_category applicable_for reset_cycle description }
      employee_categories { id name short_name description }
      employee_types { id name short_name description }
      movement_settings {
        limit_count
        limit_frequency
        max_duration_mins
        days_before_apply
        user_entry
        limit_enabled
      }
    }
  }
`;

export const UPSERT_SETTINGS = gql`
  mutation UpsertSettings($input: UpdateSettingsInput!) {
    upsertSettings(input: $input) {
      id
      institution_name
      institution_short_name
      institution_code
      owner_name
      pan_number
      registration_number
      website_url
      fax_number
      contact_email
      contact_phone
      contact_mobile
      working_days
      movement_settings {
        limit_count
        limit_frequency
        max_duration_mins
        days_before_apply
        user_entry
        limit_enabled
      }
    }
  }
`;

export const UPSERT_DEPARTMENT = gql`
  mutation UpsertDepartment($input: UpsertMasterDataInput!) {
    upsertDepartment(input: $input) {
      id name short_name description
    }
  }
`;

export const DELETE_DEPARTMENT = gql`
  mutation DeleteDepartment($id: ID!) {
    deleteDepartment(id: $id)
  }
`;

export const UPSERT_DESIGNATION = gql`
  mutation UpsertDesignation($input: UpsertMasterDataInput!) {
    upsertDesignation(input: $input) {
      id name short_name description
    }
  }
`;

export const DELETE_DESIGNATION = gql`
  mutation DeleteDesignation($id: ID!) {
    deleteDesignation(id: $id)
  }
`;

export const UPSERT_LEAVE_TYPE = gql`
  mutation UpsertLeaveType($input: UpsertLeaveTypeInput!) {
    upsertLeaveType(input: $input) {
      id name code total_days max_per_request max_consecutive_leaves days_before_apply max_consecutive_days weekends_covered holiday_covered user_entry balance_enabled workload_interchange document_required leave_category applicable_for reset_cycle description
    }
  }
`;

export const DELETE_LEAVE_TYPE = gql`
  mutation DeleteLeaveType($id: ID!) {
    deleteLeaveType(id: $id)
  }
`;

export const UPSERT_CATEGORY = gql`
  mutation UpsertCategory($input: UpsertMasterDataInput!) {
    upsertEmployeeCategory(input: $input) {
      id name short_name description
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteEmployeeCategory(id: $id)
  }
`;

export const UPSERT_EMPLOYEE_TYPE = gql`
  mutation UpsertEmployeeType($input: UpsertMasterDataInput!) {
    upsertEmployeeType(input: $input) {
      id name short_name description
    }
  }
`;

export const DELETE_EMPLOYEE_TYPE = gql`
  mutation DeleteEmployeeType($id: ID!) {
    deleteEmployeeType(id: $id)
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalEmployees
      onLeaveToday
      presentToday
      absentToday
      pendingApprovals
      pendingLeaves
      pendingMovements
      onLeaveEmployees {
        id
        name
        department
        leave_type
      }
      upcomingHolidays {
        id
        name
        date
        type
        description
      }
    }
  }
`;
