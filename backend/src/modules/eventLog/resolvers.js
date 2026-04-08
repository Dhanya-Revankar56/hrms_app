const eventLogService = require("./service");
const Employee = require("../employee/model");
const { GraphQLJSON } = require('graphql-type-json');

// 🛡 Multi-Tenant EventLog Resolvers
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    eventLogs: async (_, args, ctx) => {
      const role = ctx.user?.role;
      let listArgs = { ...args };

      if (role === "EMPLOYEE") {
        // Employee: Only their own actions (as user_id) or actions about them (as record_id)
        const empRecord = await Employee.findOne({ user_id: ctx.user.id }).select("_id").lean();
        const empId = empRecord?._id?.toString();
        
        listArgs.user_id = ctx.user.id;
        listArgs.record_id = empId;
      } else if (role === "HEAD OF DEPARTMENT") {
        const hodRecord = await Employee.findOne({ user_id: ctx.user.id })
          .select("work_detail.department")
          .lean();
        const hodDeptId = hodRecord?.work_detail?.department?.toString();
        
        if (hodDeptId) {
          const employees = await Employee.find({ 
            "work_detail.department": hodDeptId 
          }).select("_id user_id").lean();
          
          listArgs.user_id = employees.map(e => e.user_id?.toString()).filter(id => id);
          listArgs.record_id = employees.map(e => e._id.toString());
        } else {
          listArgs.user_id = []; 
          listArgs.record_id = [];
        }
      } else if (role === "ADMIN") {
        listArgs.user_id = args.user_id;
        listArgs.record_id = args.record_id;
      }

      return await eventLogService.listEventLogs(listArgs);
    }
  },
  EventLog: {
    id: (parent) => parent._id?.toString() || parent.id
  }
};

module.exports = resolvers;
