require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const connectDB = require("./src/config/db");
const { typeDefs, resolvers } = require("./src/modules");
const { getUserFromToken } = require("./src/middleware/auth");

async function startServer() {
  const app = express();

  // Connect MongoDB
  await connectDB();

  // Create Apollo Server (v3 — Modular)
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // 🏷 Pull institution from header (default/legacy)
      const institution_id = req.headers["x-institution-id"] || null;
      
      // 🛡 Extract user from JWT token
      const user = getUserFromToken(req);
      
      return { 
        institution_id: user ? user.institution_id : institution_id,
        user 
      };
    },
    formatError: (err) => {
      console.error("[GraphQL Error]", err.message);
      return { message: err.message };
    },
  });

  await apolloServer.start();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "HRMS Modular Backend is running 🚀" });
  });

  // Mount GraphQL
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🚀 GraphQL playground: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
