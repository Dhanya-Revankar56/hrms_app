import { gql } from '@apollo/client';

export const GET_EMPLOYEES = gql`
  query GetAllEmployees($status: String, $department: String, $search: String, $pagination: PaginationInput) {
    getAllEmployees(status: $status, department: $department, search: $search, pagination: $pagination) {
      items {
        id
        employee_id
        first_name
        last_name
        user_email
        user_contact
        app_role
        app_status
        employee_image
        reporting_to
        work_detail {
          department { id name }
          designation { id name }
          employee_type
          date_of_joining
        }
        personal_detail {
          gender
          date_of_birth
          blood_group
          marital_status
          aadhar_no
          pan_no
          pf_no
          esic_no
        }
        bank_detail {
          bank_name
          account_no
          ifsc
          bank_type
        }
      }
      pageInfo {
        totalCount
        totalPages
        currentPage
        hasNextPage
      }
      activeCount
      onLeaveCount
    }
  }
`;

export const GET_EMPLOYEE_BY_ID = gql`
  query GetEmployee($id: ID!) {
    employee(id: $id) {
      id
      employee_id
      first_name
      last_name
      user_email
      user_contact
      app_role
      app_status
      employee_image
      reporting_to
      personal_detail {
        date_of_birth
        gender
        marital_status
        aadhar_no
        pan_no
        blood_group
        pf_no
        esic_no
      }
      work_detail {
        date_of_joining
        designation { id name }
        department { id name }
        employee_type
        reporting_to
      }
      bank_detail {
        bank_name
        account_no
        ifsc
        bank_type
      }
    }
  }
`;

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) {
      id
      first_name
      last_name
      user_email
    }
  }
`;
export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      first_name
      last_name
      user_email
      app_role
    }
  }
`;

export const REHIRE_EMPLOYEE = gql`
  mutation ReHireEmployee($id: ID!) {
    reHireEmployee(id: $id) {
      id
      first_name
      last_name
    }
  }
`;
