const documentService = require("./service");

// 🛡 Multi-Tenant Document Resolvers
const resolvers = {
  Query: {
    employeeDocuments: async (_, { employee_id }, _ctx) => {
      return await documentService.getEmployeeDocuments(employee_id);
    },
  },

  Mutation: {
    uploadDocument: async (
      _,
      { employee_id, name, file_url, file_type },
      _ctx,
    ) => {
      return await documentService.uploadDocument({
        employee_id,
        name,
        file_url,
        file_type,
      });
    },
    deleteDocument: async (_, { id }, _ctx) => {
      return await documentService.deleteDocument(id);
    },
  },

  EmployeeDocument: {
    id: (parent) => parent._id.toString(),
  },
};

module.exports = resolvers;
