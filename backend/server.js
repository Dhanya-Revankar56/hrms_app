require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const tenantPlugin = require("./src/middleware/tenantPlugin");
const { runWithTenant } = require("./src/middleware/tenantContext");
const { getUserFromToken } = require("./src/middleware/auth");

// 🛡 Apply Global Tenant Enforcement (MUST be before requiring modules/models)
mongoose.plugin(tenantPlugin);

const connectDB = require("./src/config/db");
const { typeDefs, resolvers } = require("./src/modules");

async function startServer() {
  const app = express();

  // Connect MongoDB
  await connectDB();

  // Create Apollo Server (v3 — Modular)
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // 🛡 Extract user identity safely
      const user = req ? getUserFromToken(req) : null;

      return {
        req, // 🛡 Include req for resolvers that need IP/UserAgent
        tenant_id: user?.tenant_id || null,
        institution_id: user?.tenant_id || null,
        user,
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

  // 🛡 Zero-Leakage Tenant Scoping Middleware (Enterprise Grade)
  app.use((req, res, next) => {
    const user = req ? getUserFromToken(req) : null;
    req.user = user; // 🛡 Attach for REST controllers

    const tenantId = user?.tenant_id || null;
    req.tenant_id = tenantId; // 🛡 Flat access for REST utilities
    req.institution_id = tenantId; // Backward compatibility

    // 🛡 Protection for REST API (except health check)
    if (!tenantId && req.path.startsWith("/api/reports")) {
      console.warn(
        `[Server] Blocked unauthenticated report request to ${req.path}. User: ${user ? "present" : "null"}, Tenant: ${tenantId}`,
      );
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    if (!tenantId && req.path.startsWith("/graphql")) {
      return next(); // 🔓 Public access for GraphQL login/registration
    }

    if (!tenantId) {
      return next(); // 🔓 Public access for other routes
    }

    // 🔒 Isolated execution context for database queries
    runWithTenant({ tenantId, role: user?.role }, () => next());
  });

  // REST API Routes
  const reportRoutes = require("./src/modules/reports/routes");
  app.use("/api/reports", reportRoutes);

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
