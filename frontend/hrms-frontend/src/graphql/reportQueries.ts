import { gql } from "@apollo/client";

export const GET_HR_ANALYTICS = gql`
  query GetHrAnalytics {
    hrAnalytics {
      employeeStats {
        total
        active
        onLeave
        genderBreakdown {
          label
          count
        }
        deptBreakdown {
          label
          count
        }
      }
      attendanceStats {
        todayPresent
        todayAbsent
        weeklyTrend {
          label
          count
        }
      }
      leaveStats {
        pending
        approved
        rejected
        typeBreakdown {
          label
          count
        }
      }
    }
  }
`;
