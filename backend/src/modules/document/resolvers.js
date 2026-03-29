const documentService = require("./service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const resolvers = {
  Query: {
    employeeDocuments: async (_, { employee_id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await documentService.getEmployeeDocuments(employee_id, institution_id);
    },
  },

  Mutation: {
    uploadDocument: async (_, { employee_id, name, file_url, file_type }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await documentService.uploadDocument({ employee_id, name, file_url, file_type }, institution_id);
    },
    deleteDocument: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await documentService.deleteDocument(id, institution_id);
    },
  },

  EmployeeDocument: {
    id: (parent) => parent._id.toString(),
  }
};

module.exports = resolvers;
