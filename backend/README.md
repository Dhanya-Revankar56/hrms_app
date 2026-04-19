# ⚙️ HRMS Backend — API & Business Logic Layer

Node.js + Express + Apollo Server (GraphQL) + MongoDB backend powering the HRMS platform. Implements a modular, service-layer architecture with multi-tenancy, role-based access control, and automated PDF report generation.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Module Structure Pattern](#-module-structure-pattern)
- [Authentication Flow](#-authentication-flow)
- [Multi-Tenancy](#-multi-tenancy)
- [Role-Based Access Control](#-role-based-access-control)
- [Example Workflows](#-example-workflows)
- [Reports Engine](#-reports-engine)
- [Logging & Debugging](#-logging--debugging)
- [Design Principles](#-design-principles)
- [Running the Server](#-running-the-server)

---

## 🔍 Overview

| Aspect | Detail |
|---|---|
| **Runtime** | Node.js v18+ |
| **Framework** | Express |
| **API Layer** | Apollo Server v4 (Express integration) |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (JSON Web Tokens) |
| **Reports** | Puppeteer + Handlebars → PDF |
| **Architecture** | Feature-based modular, service-layer pattern |
| **Tenancy** | Multi-tenant with `tenant_id` isolation |

---

## 🏗 Architecture

### High-Level Flow

```
Client (React / Apollo)
  │
  ▼
Apollo Server (Express :5000)
  │
  ├── auth middleware (JWT decode → user context)
  │
  ▼
GraphQL Resolver (thin layer)
  │
  ▼
Service Layer (all business logic)
  │
  ▼
Mongoose Model (schema + DB operations)
  │
  ▼
MongoDB Atlas (persistent storage)
```

### Layer Responsibilities

| Layer | File | Responsibility |
|---|---|---|
| **Schema** | `typeDefs.js` | Defines GraphQL types, queries, and mutations |
| **Resolver** | `resolvers.js` | Extracts context (user, tenant), delegates to service |
| **Service** | `service.js` | Contains ALL business logic, validation, and DB calls |
| **Model** | `model.js` | Mongoose schema definition and model export |

### Key Rule

```
Resolver → extracts context → calls service → returns result
           (thin)             (all logic)     (no transformation)
```

Resolvers **never** call Mongoose directly. All database operations go through the service layer.

---

## 📂 Folder Structure

```
backend/
├── server.js                     # Express + Apollo Server entry point
├── package.json                  # Dependencies & scripts
├── .env                          # Environment variables (not committed)
├── eslint.config.js              # ESLint configuration
└── src/
    ├── config/
    │   └── db.js                 # MongoDB connection (Mongoose)
    │
    ├── middleware/
    │   └── auth.js               # JWT decode → attaches user to GraphQL context
    │
    ├── modules/                  # Feature-based modules (see pattern below)
    │   ├── index.js              # Module registry (merges all typeDefs + resolvers)
    │   ├── commonTypeDefs.js     # Shared GraphQL types (pagination, etc.)
    │   │
    │   ├── auth/                 # Login, register, JWT
    │   ├── employee/             # Employee CRUD
    │   ├── attendance/           # Attendance records
    │   ├── leave/                # Leave applications & balances
    │   ├── movement/             # Movement register
    │   ├── relieving/            # Exit & relieving workflow
    │   ├── document/             # Employee document management
    │   ├── holiday/              # Holiday calendar
    │   ├── settings/             # Org settings & leave types
    │   ├── eventLog/             # Audit trail / event register
    │   ├── reports/              # PDF report generation engine
    │   │   ├── controller.js     # REST endpoint handler
    │   │   ├── routes.js         # Express routes (/api/reports/*)
    │   │   ├── engine/
    │   │   │   ├── reportEngine.js   # Orchestrator
    │   │   │   ├── fetcher.js        # Data fetching from MongoDB
    │   │   │   └── queryEngine.js    # Query builder
    │   │   ├── registry/
    │   │   │   ├── attendance.reports.js
    │   │   │   ├── leave.reports.js
    │   │   │   ├── movement.reports.js
    │   │   │   ├── employee.reports.js
    │   │   │   └── systems.reports.js
    │   │   ├── renderers/
    │   │   │   └── pdfBuilder.js     # Puppeteer HTML → PDF
    │   │   └── templates/
    │   │       ├── *.hbs             # Handlebars HTML templates
    │   │       └── assets/
    │   │           └── report-styles.css
    │   ├── tenant/               # Multi-tenancy support
    │   ├── counter/              # Auto-increment employee IDs
    │   ├── analytics/            # Dashboard statistics
    │   ├── audit/                # Audit logging
    │   └── payroll/              # Payroll (scaffold)
    │
    └── utils/                    # Shared utilities
```

---

## 🧩 Module Structure Pattern

Every feature module follows the same 4-file pattern:

```
module/
├── model.js        # Mongoose schema & model definition
├── typeDefs.js     # GraphQL type definitions (SDL)
├── resolvers.js    # Query & mutation handlers (thin)
└── service.js      # Business logic & database operations
```

### File Responsibilities

#### `model.js` — Database Schema

```js
// Defines the Mongoose schema and exports the model
const schema = new mongoose.Schema({
  employee_id: { type: String, required: true },
  tenant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  status:      { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
  // ...
}, { timestamps: true });

module.exports = mongoose.model('Leave', schema);
```

#### `typeDefs.js` — GraphQL Schema

```graphql
type Leave {
  id: ID!
  employee_id: String!
  leave_type: String!
  status: String!
}

type Query {
  leaves(employee_id: String, status: String): LeaveResponse!
}

type Mutation {
  applyLeave(input: LeaveInput!): Leave!
  updateLeave(id: ID!, input: LeaveUpdateInput!): Leave!
}
```

#### `resolvers.js` — Request Handler (Thin)

```js
// Extracts user context, delegates to service, returns result
const resolvers = {
  Query: {
    leaves: async (_, args, context) => {
      const { user } = context;
      console.log(`[LeaveResolver] User: ${user.email}, Role: ${user.role}`);
      return leaveService.getLeaves(args, user);
    }
  }
};
```

#### `service.js` — Business Logic (All Logic Here)

```js
// Contains ALL validation, filtering, and database operations
async function getLeaves(args, user) {
  const filter = { tenant_id: user.tenant_id };

  // Role-based scoping
  if (user.role === 'EMPLOYEE') {
    filter.employee_id = user.id;
  } else if (user.role === 'HOD') {
    filter.department = user.department;
  }
  // ADMIN → no additional filter (sees all)

  return Leave.find(filter).sort({ created_at: -1 });
}
```

---

## 🔐 Authentication Flow

```
1. Login Request
   POST /graphql → loginUser mutation
   → auth/service.js validates email + password against MongoDB
   → On success: JWT generated with payload:
     { userId, email, role, tenant_id, department }

2. Token Storage
   → JWT returned to frontend
   → Stored in localStorage
   → Attached to every request via Authorization header:
     Authorization: Bearer <token>

3. Request Authentication
   → auth middleware (middleware/auth.js) runs on every request
   → Decodes JWT → extracts user payload
   → Attaches to GraphQL context:
     context.user = { id, email, role, tenant_id, department }

4. Resolver Access
   → Every resolver receives context.user
   → Uses it for tenant scoping + role filtering
```

### Auth Middleware (Simplified)

```js
// middleware/auth.js
function authMiddleware(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  }
  return { user: null };
}
```

---

## 🏢 Multi-Tenancy

Every database record includes a `tenant_id` field. This ensures complete data isolation between organizations.

### How It Works

1. **JWT contains `tenant_id`** — set during login based on the user's organization
2. **Every service function** adds `tenant_id` to its query filter:
   ```js
   const filter = { tenant_id: user.tenant_id };
   ```
3. **No cross-tenant data leakage** — a user from Org A can never see Org B's data
4. **Enforced at service layer** — not dependent on frontend behavior

### Data Flow

```
JWT payload: { tenant_id: "abc123", role: "ADMIN", ... }
  → resolver extracts context.user
    → service adds filter: { tenant_id: "abc123" }
      → MongoDB returns only tenant's data
```

---

## 👥 Role-Based Access Control

Three roles with hierarchical data access:

| Role | Scope | What They See |
|---|---|---|
| **ADMIN** | Organization-wide | All employees, all departments, all records |
| **HOD** | Department-level | Only employees and records in their department |
| **EMPLOYEE** | Self only | Only their own records |

### Enforcement Pattern (in every service)

```js
async function getRecords(args, user) {
  const filter = { tenant_id: user.tenant_id };

  switch (user.role) {
    case 'ADMIN':
      // No additional filter — sees everything
      break;
    case 'HOD':
      filter.department = user.department;
      break;
    case 'EMPLOYEE':
      filter.employee_id = user.id;
      break;
  }

  return Model.find(filter);
}
```

### Role Checks in Resolvers

```js
// Admin-only mutation
if (context.user.role !== 'ADMIN') {
  throw new Error('Unauthorized: Admin access required');
}
```

---

## 📝 Example Workflows

### Leave Application Flow

```
Employee applies for leave (frontend)
  → useMutation(APPLY_LEAVE) → GraphQL
    → resolvers.js: applyLeave(_, { input }, context)
      → Extracts context.user (employee ID, tenant)
        → service.js: createLeave(input, user)
          → Validates: date range, leave type exists, balance available
            → Creates leave record: { status: "Pending", tenant_id, employee_id }
              → Returns created leave → frontend updates UI

Admin approves leave
  → useMutation(UPDATE_LEAVE) → GraphQL
    → resolvers.js: updateLeave(_, { id, input }, context)
      → service.js: updateLeave(id, { status: "Approved" }, user)
        → Updates record → adjusts leave balance
          → Returns updated leave → frontend reflects approval
```

### Movement Register Flow

```
Employee applies for movement
  → CREATE_MOVEMENT mutation
    → resolver → service.js
      → Creates record: { status: "Pending", out_time, in_time, purpose }
        → Saved to MongoDB

Admin approves
  → UPDATE_MOVEMENT mutation
    → resolver → service.js
      → Updates status: "Pending" → "Approved"
        → Frontend reflects change
```

---

## 📈 Reports Engine

The reports module uses a **registry + template + renderer** pipeline to generate PDF reports.

### Architecture

```
Frontend: POST /api/reports/generate { reportType, filters }
  │
  ▼
controller.js (Express route handler)
  │
  ▼
reportEngine.js (orchestrator)
  ├── Selects report definition from registry/
  ├── Calls fetcher.js → runs MongoDB queries
  ├── Passes data to Handlebars template (.hbs)
  └── Calls pdfBuilder.js → Puppeteer renders HTML → PDF buffer
  │
  ▼
PDF buffer returned → browser downloads file
```

### Components

| Component | File | Purpose |
|---|---|---|
| **Controller** | `controller.js` | Handles REST endpoint, validates input |
| **Engine** | `reportEngine.js` | Orchestrates the full pipeline |
| **Fetcher** | `fetcher.js` | Queries MongoDB for report data |
| **Registry** | `registry/*.js` | Defines report types, filters, and data shape |
| **Templates** | `templates/*.hbs` | Handlebars HTML templates for each report |
| **Renderer** | `pdfBuilder.js` | Puppeteer converts HTML → PDF |

### Supported Reports

| Report | Registry File | Description |
|---|---|---|
| Daily Attendance | `attendance.reports.js` | Attendance summary for a date range |
| Daily Leave | `leave.reports.js` | Employees on leave for a specific date |
| Daily Movement | `movement.reports.js` | Movement register for a date range |
| Employee List | `employee.reports.js` | Filtered employee directory |
| System Activity | `systems.reports.js` | Audit trail / event log export |

---

## 🔍 Logging & Debugging

### Resolver Logs

Every resolver logs the incoming request with user context:

```
[LeaveResolver] Fetching for User: admin@org.com, Role: ADMIN
[LeaveResolver] Final Filter → id: ALL, dept: NONE
```

```
[MovementResolver] Fetching for User: hod@org.com, Role: HOD
[MovementResolver] Final Query → id: 69e38c..., dept: Engineering
```

### What Gets Logged

| Log Point | Information |
|---|---|
| **Resolver entry** | User email, role, action |
| **Filter construction** | Final query filter sent to MongoDB |
| **Auth middleware** | Token decode success/failure |
| **Server startup** | MongoDB connection status, port |

### Debugging Tips

- **Empty data?** Check resolver logs for the filter being applied
- **Auth errors?** Verify JWT token is valid and not expired
- **Wrong data scope?** Check role-based filter in the service function
- **Report generation fails?** Check Puppeteer installation and template path

---

## 📌 Design Principles

| Principle | Implementation |
|---|---|
| **Service Layer Pattern** | All business logic in `service.js` — resolvers are thin wrappers |
| **Thin Resolvers** | Resolvers only extract context and delegate — no logic, no validation |
| **Feature-Based Modules** | Each feature is a self-contained folder with model, typeDefs, resolvers, service |
| **No Direct DB in Resolvers** | Resolvers never import Mongoose models — only call service functions |
| **Separation of Concerns** | Schema (typeDefs) → Handler (resolver) → Logic (service) → Data (model) |
| **Tenant Isolation** | Every query includes `tenant_id` from JWT — no exceptions |
| **Role-Based Scoping** | Services filter data based on `user.role` — enforced server-side |
| **Schema-First GraphQL** | Types defined in SDL (typeDefs.js), not code-first |
| **Consistent Module Structure** | Every module follows the same 4-file pattern |
| **Centralized Module Registry** | `modules/index.js` merges all typeDefs and resolvers automatically |

---

## 🚀 Running the Server

### Prerequisites

- Node.js v18+
- MongoDB Atlas connection string

### Setup

```bash
cd backend
npm install
```

### Development

```bash
npm run dev
# → Uses nodemon for auto-restart
# → Server at http://localhost:5000
# → GraphQL Playground at http://localhost:5000/graphql
```

### Production

```bash
npm start
# → Runs node server.js directly
```

### Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<your-secret-key>
```

---

<p align="center">
  Part of the <a href="../README.md">HRMS Application</a> monorepo
</p>
