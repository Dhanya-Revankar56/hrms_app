const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type StatItem {
    label: String!
    count: Int!
  }

  type HrEmployeeStats {
    total: Int!
    active: Int!
    onLeave: Int!
    genderBreakdown: [StatItem]
    deptBreakdown: [StatItem]
  }

  type HrAttendanceStats {
    todayPresent: Int!
    todayAbsent: Int!
    weeklyTrend: [StatItem]
  }

  type HrLeaveStats {
    pending: Int!
    approved: Int!
    rejected: Int!
    typeBreakdown: [StatItem]
  }

  type HRAnalytics {
    employeeStats: HrEmployeeStats
    attendanceStats: HrAttendanceStats
    leaveStats: HrLeaveStats
  }

  extend type Query {
    hrAnalytics: HRAnalytics
  }
`;

module.exports = typeDefs;
