const authService = require("./service");

const authResolvers = {
  Mutation: {
    login: async (_, { email, password }, { req }) => {
      // 🛡 Safe Metadata Extraction
      const ip =
        req?.headers?.["x-forwarded-for"] ||
        req?.socket?.remoteAddress ||
        req?.ip ||
        "unknown";
        
      const userAgent = req?.headers?.["user-agent"] || "unknown";

      return await authService.login(email, password, {
        ip,
        userAgent
      });
    }
  }
};

module.exports = authResolvers;
