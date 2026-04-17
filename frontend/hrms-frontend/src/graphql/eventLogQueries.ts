import { gql } from "@apollo/client";

export const GET_EVENT_LOGS = gql`
  query GetEventLogs(
    $module_name: String
    $action_type: String
    $user_id: String
    $record_id: String
    $date_from: String
    $date_to: String
    $search: String
    $pagination: PaginationInput
  ) {
    eventLogs(
      module_name: $module_name
      action_type: $action_type
      user_id: $user_id
      record_id: $record_id
      date_from: $date_from
      date_to: $date_to
      search: $search
      pagination: $pagination
    ) {
      items {
        id
        user_id
        user_name
        user_role
        action_type
        module_name
        record_id
        description
        old_data
        new_data
        ip_address
        timestamp
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
