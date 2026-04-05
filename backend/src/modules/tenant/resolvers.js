const Tenant = require("./model");

const tenantResolvers = {
  Query: {
    publicTenants: async () => {
      // 🛡 Public endpoint to populate the login dropdown
      return await Tenant.find({ isActive: true }).setOptions({ skipTenant: true }).lean();
    }
  }
};

module.exports = tenantResolvers;
