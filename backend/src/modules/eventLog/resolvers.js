const eventLogService = require("./service");
const Employee = require("../employee/model");
const { GraphQLJSON } = require('graphql-type-json');

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    eventLogs: async (_, args, ctx) => {
      const institution_id = requireTenant(ctx);
      const role = ctx.user?.role;
      
      let listArgs = { ...args, institution_id };

      if (role === "EMPLOYEE") {
        // Employee: Only their own actions or actions about them
        listArgs.user_id = ctx.user.id;
        listArgs.record_id = ctx.user.id;
      } else if (role === "HEAD OF DEPARTMENT") {
        // HOD: Only actions by/about employees in their department
        const hodRecord = await Employee.findOne({ _id: ctx.user.id, institution_id })
          .select("work_detail.department")
          .lean();
        const hodDeptId = hodRecord?.work_detail?.department?.toString();
        
        if (hodDeptId) {
          const employees = await Employee.find({ 
            institution_id, 
            "work_detail.department": hodDeptId 
          }).select("_id").lean();
          const employeeIds = employees.map(e => e._id.toString());
          listArgs.user_id = employeeIds;
          listArgs.record_id = employeeIds;
        } else {
          listArgs.user_id = []; 
          listArgs.record_id = [];
        }
      } else if (role === "ADMIN") {
        // Admin: use original args (allow them to filter by user_id if they want)
        listArgs.user_id = args.user_id;
        listArgs.record_id = undefined; // Don't filter by subject unless explicitly added later
      }

      return await eventLogService.listEventLogs(listArgs);
    }
  },
  EventLog: {
    id: (parent) => parent._id?.toString() || parent.id
  }
};

module.exports = resolvers;
