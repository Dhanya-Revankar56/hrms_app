import { gql } from "@apollo/client";

export const GET_MOVEMENTS = gql`
  query GetMovements($employee_id: String, $status: String, $movement_type: String, $department: String, $pagination: PaginationInput) {
    movements(employee_id: $employee_id, status: $status, movement_type: $movement_type, department: $department, pagination: $pagination) {
      items {
        id
        employee_id
        employee_code
        movement_type
        from_location
        to_location
        purpose
        movement_date
        out_time
        in_time
        status
        dept_admin_status
        dept_admin_id
        dept_admin_date
        dept_admin_remarks
        admin_status
        admin_id
        admin_date
        admin_remarks
        remarks
        employee {
          id
          first_name
          last_name
          employee_id
          employee_image
          work_detail {
            department { id name }
            designation { id name }
          }
        }
      }
      pageInfo {
        totalCount
        totalPages
        currentPage
        hasNextPage
      }
    }
  }
`;

export const CREATE_MOVEMENT = gql`
  mutation CreateMovement($input: CreateMovementInput!) {
    createMovement(input: $input) {
      id
      status
    }
  }
`;

export const UPDATE_MOVEMENT = gql`
  mutation UpdateMovement($id: ID!, $input: UpdateMovementInput!) {
    updateMovement(id: $id, input: $input) {
      id
      status
      dept_admin_status
      admin_status
    }
  }
`;
