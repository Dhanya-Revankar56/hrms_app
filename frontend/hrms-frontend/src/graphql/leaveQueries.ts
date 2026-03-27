import { gql } from "@apollo/client";

export const GET_LEAVES = gql`
  query GetLeaves($employee_id: String, $status: String, $leave_type: String, $department: String, $search: String, $month: Int, $year: Int, $pagination: PaginationInput) {
    leaves(employee_id: $employee_id, status: $status, leave_type: $leave_type, department: $department, search: $search, month: $month, year: $year, pagination: $pagination) {
      items {
        id
        employee_id
        employee_code
        leave_type
        from_date
        to_date
        total_days
        reason
        status
        approvals {
          role
          status
          updated_at
          updated_by
          remarks
        }
        requested_date
        is_half_day
        half_day_type
        document_url
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
      rejectedCount
      approvedCount
      pendingCount
      filteredTotalCount
    }
  }
`;

export const GET_LEAVE_BALANCES = gql`
  query GetLeaveBalances($employee_id: String!) {
    leaveBalances(employee_id: $employee_id) {
      id
      employee_id
      leave_type
      total
      used
      balance
    }
  }
`;

export const APPLY_LEAVE = gql`
  mutation ApplyLeave($input: ApplyLeaveInput!) {
    applyLeave(input: $input) {
      id
      status
    }
  }
`;

export const UPDATE_LEAVE_APPROVAL = gql`
  mutation UpdateLeaveApproval($id: ID!, $role: String!, $status: String!, $remarks: String) {
    updateLeaveApproval(id: $id, role: $role, status: $status, remarks: $remarks) {
      id
      status
      approvals {
        role
        status
        remarks
      }
    }
  }
`;

export const CANCEL_LEAVE = gql`
  mutation CancelLeave($id: ID!) {
    cancelLeave(id: $id) {
      id
      status
    }
  }
`;

export const DELETE_LEAVE = gql`
  mutation DeleteLeave($id: ID!) {
    deleteLeave(id: $id) {
      success
      message
    }
  }
`;
