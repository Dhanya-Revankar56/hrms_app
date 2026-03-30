const commonTypeDefs = require("./commonTypeDefs");
const employeeTypeDefs = require("./employee/typeDefs");
const attendanceTypeDefs = require("./attendance/typeDefs");
const leaveTypeDefs = require("./leave/typeDefs");
const relievingTypeDefs = require("./relieving/typeDefs");
const movementTypeDefs = require("./movement/typeDefs");
const settingsTypeDefs = require("./settings/typeDefs");

const payrollTypeDefs = require("./payroll/typeDefs");
const documentTypeDefs = require("./document/typeDefs");
const holidayTypeDefs = require("./holiday/typeDefs");
const eventLogTypeDefs = require("./eventLog/typeDefs");
const analyticsTypeDefs = require("./analytics/typeDefs");

const employeeResolvers = require("./employee/resolvers");
const attendanceResolvers = require("./attendance/resolvers");
const leaveResolvers = require("./leave/resolvers");
const relievingResolvers = require("./relieving/resolvers");
const movementResolvers = require("./movement/resolvers");
const settingsResolvers = require("./settings/resolvers");
const payrollResolvers = require("./payroll/resolvers");
const documentResolvers = require("./document/resolvers");
const holidayResolvers = require("./holiday/resolvers");
const eventLogResolvers = require("./eventLog/resolvers");
const analyticsResolvers = require("./analytics/resolvers");

const typeDefs = [
  commonTypeDefs,
  employeeTypeDefs,
  attendanceTypeDefs,
  leaveTypeDefs,
  relievingTypeDefs,
  movementTypeDefs,
  settingsTypeDefs,
  payrollTypeDefs,
  documentTypeDefs,
  holidayTypeDefs,
  eventLogTypeDefs,
  analyticsTypeDefs,
];

const resolvers = [
  employeeResolvers,
  attendanceResolvers,
  leaveResolvers,
  relievingResolvers,
  movementResolvers,
  settingsResolvers,
  payrollResolvers,
  documentResolvers,
  holidayResolvers,
  eventLogResolvers,
  analyticsResolvers,
];

module.exports = { typeDefs, resolvers };
