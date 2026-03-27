import { gql } from "@apollo/client";

export const GET_RELIEVINGS = gql`
  query GetRelievings($employee_id: String, $status: String, $pagination: PaginationInput) {
    relievings(employee_id: $employee_id, status: $status, pagination: $pagination) {
      items {
        id
        employee_id
        employee_code
        resignation_date
        last_working_date
        notice_period_days
        reason
        status
        exit_interview_done
        assets_returned
        relieve_letter_path
        remarks
        created_at
        updated_at
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

export const CREATE_RELIEVING = gql`
  mutation CreateRelieving($input: CreateRelievingInput!) {
    createRelieving(input: $input) {
      id
      status
    }
  }
`;

export const UPDATE_RELIEVING = gql`
  mutation UpdateRelieving($id: ID!, $input: UpdateRelievingInput!) {
    updateRelieving(id: $id, input: $input) {
      id
      status
    }
  }
`;
