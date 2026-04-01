const authService = require("./service");

const authResolvers = {
  Mutation: {
    login: async (_, { email, password }) => {
      return await authService.login(email, password);
    }
  }
};

module.exports = authResolvers;
