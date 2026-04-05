import { gql } from "@apollo/client";

export const GET_HOLIDAYS = gql`
  query GetHolidays($year: Int, $month: Int) {
    holidays(year: $year, month: $month) {
      id
      name
      date
      type
      description
      is_active
    }
  }
`;
