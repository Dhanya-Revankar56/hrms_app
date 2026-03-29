import { gql } from "@apollo/client";

export const GET_EMPLOYEE_DOCUMENTS = gql`
  query GetEmployeeDocuments($employee_id: ID!) {
    employeeDocuments(employee_id: $employee_id) {
      id
      name
      file_url
      file_type
      status
      created_at
    }
  }
`;
