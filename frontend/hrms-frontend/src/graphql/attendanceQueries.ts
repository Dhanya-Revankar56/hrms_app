import { gql } from "@apollo/client";

export const GET_ATTENDANCES = gql`
  query GetAttendances($employee_id: String, $status: String, $from_date: String, $to_date: String, $pagination: PaginationInput) {
    attendances(employee_id: $employee_id, status: $status, from_date: $from_date, to_date: $to_date, pagination: $pagination) {
      items {
        id
        employee_id
        employee_code
        date
        check_in
        check_out
        status
        working_hours
        overtime_hours
        note
        marked_by
        employee {
          id
          first_name
          last_name
          employee_id
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

export const CREATE_ATTENDANCE = gql`
  mutation CreateAttendance($input: CreateAttendanceInput!) {
    createAttendance(input: $input) {
      id
      date
      status
      check_in
      check_out
      working_hours
    }
  }
`;

export const UPDATE_ATTENDANCE = gql`
  mutation UpdateAttendance($id: ID!, $input: UpdateAttendanceInput!) {
    updateAttendance(id: $id, input: $input) {
      id
      status
      check_in
      check_out
      working_hours
    }
  }
`;
