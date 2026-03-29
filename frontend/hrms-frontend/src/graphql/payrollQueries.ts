import { gql } from "@apollo/client";

export const GET_SALARY_RECORD = gql`
  query GetSalaryRecord($employee_id: ID!) {
    salaryRecord(employee_id: $employee_id) {
      id
      employee_id
      monthly_ctc
      annual_ctc
      net_monthly_salary
      net_annual_salary
      earnings {
        basic
        agp
        da
        hra
      }
      effective_from
      status
    }
  }
`;

export const GET_PAYSLIPS = gql`
  query GetPayslips($employee_id: ID!, $pagination: PaginationInput) {
    payslips(employee_id: $employee_id, pagination: $pagination) {
      items {
        id
        month
        amount
        pdf_url
        status
        created_at
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
