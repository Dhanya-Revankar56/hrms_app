# 🏢 HRMS — Human Resource Management System

A full-stack, enterprise-grade Human Resource Management System built with **React**, **GraphQL**, and **MongoDB**. Designed for multi-tenant organizations to manage employees, attendance, leave, movement tracking, relieving workflows, and automated reporting — all from a single unified dashboard.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Module Overview](#-module-overview)
- [End-to-End Workflows](#-end-to-end-workflow-how-modules-connect)
- [Design Principles](#-design-principles)
- [How AI Should Understand This Project](#-how-ai-should-understand-this-project)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Code Quality](#-code-quality)
- [License](#-license)

---

## 🔍 Project Overview

This HRMS platform provides a centralized system for organizations to manage their workforce lifecycle — from onboarding and daily attendance tracking to leave management, movement monitoring, and employee exit/relieving workflows.

### Key Capabilities

| Feature | Description |
|---|---|
| **Employee Management** | Full CRUD with personal details, work details, documents, and role-based views |
| **Attendance Tracking** | Monthly calendar view with session-level tracking, shift management, and bulk status updates |
| **Leave Management** | Multi-type leave applications with approval workflows and balance tracking |
| **Movement Register** | Track employee in/out movements with analog time picker and approval flow |
| **Relieving & Exit** | End-to-end exit workflow — resignation, clearance, settlement, and relieving |
| **Reports** | PDF report generation for attendance, leave, movement, and system activity |
| **Event Register** | Comprehensive audit trail of all system actions |
| **Role-Based Access** | Admin, HOD, and Employee roles with permission-scoped views and data isolation |
| **Multi-Tenancy** | Tenant-scoped data isolation at the database level |

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 7** | Build tooling & dev server |
| **Apollo Client** | GraphQL data fetching and cache management |
| **React Router v7** | Client-side routing |
| **Vanilla CSS** | Custom styling (no CSS frameworks) |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express** | HTTP server |
| **Apollo Server (Express v4)** | GraphQL API layer |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication |
| **Puppeteer** | PDF report generation |
| **Handlebars** | Report templates |

### DevOps & Tooling

| Tool | Purpose |
|---|---|
| **Husky** | Git hooks for pre-commit quality checks |
| **lint-staged** | Run ESLint only on staged files |
| **ESLint** | Code linting (frontend + backend) |
| **Prettier** | Code formatting |
| **npm Workspaces** | Monorepo management |

---

## 🏗 Architecture

```
┌──────────────┐     GraphQL      ┌──────────────────┐     Mongoose     ┌──────────┐
│              │   (Apollo Client) │                  │    (Services)    │          │
│   React UI   │ ◄──────────────► │  Apollo Server   │ ◄──────────────► │ MongoDB  │
│   (Vite)     │    Queries &     │  (Express)       │   CRUD Ops       │          │
│              │    Mutations     │                  │                  │          │
└──────────────┘                  └──────────────────┘                  └──────────┘
     :5173                              :5000                          Atlas Cloud
```

### Request Flow

```
User Action
  → React Component
    → Apollo Client (useQuery / useMutation)
      → GraphQL Query/Mutation
        → Backend Resolver (auth + tenant context)
          → Service Layer (business logic)
            → Mongoose Model (database operation)
              → MongoDB
```

### Authentication Flow

```
Login Page → POST /graphql (loginUser mutation)
  → Backend validates credentials
    → JWT token issued
      → Stored in localStorage
        → Sent via Authorization header on every request
          → auth middleware decodes → injects user context
```

---

## 📂 Folder Structure

```
hrms_app/
├── backend/                        # Node.js + Express + GraphQL API
│   ├── server.js                   # Express + Apollo Server entry point
│   └── src/
│       ├── config/
│       │   └── db.js               # MongoDB connection (Mongoose)
│       ├── middleware/
│       │   └── auth.js             # JWT authentication middleware
│       ├── modules/                # Feature-based modular architecture
│       │   ├── auth/               # Login, register, JWT
│       │   ├── employee/           # Employee CRUD
│       │   ├── attendance/         # Attendance records
│       │   ├── leave/              # Leave applications & balances
│       │   ├── movement/           # Movement register
│       │   ├── relieving/          # Exit & relieving workflow
│       │   ├── document/           # Employee document management
│       │   ├── holiday/            # Holiday calendar
│       │   ├── settings/           # Org settings & leave types
│       │   ├── eventLog/           # Audit trail / event register
│       │   ├── reports/            # PDF report engine
│       │   │   ├── engine/         # Query engine & fetcher
│       │   │   ├── registry/       # Report definitions per module
│       │   │   ├── renderers/      # PDF builder (Puppeteer)
│       │   │   └── templates/      # Handlebars HTML templates
│       │   ├── tenant/             # Multi-tenancy support
│       │   ├── counter/            # Auto-increment IDs
│       │   ├── analytics/          # Dashboard statistics
│       │   ├── audit/              # Audit logging
│       │   └── payroll/            # Payroll (scaffold)
│       └── utils/                  # Shared utilities
│
├── frontend/
│   └── hrms-frontend/              # React + Vite + TypeScript SPA
│       ├── index.html              # HTML entry point
│       ├── vite.config.ts          # Vite configuration
│       ├── tsconfig.app.json       # TypeScript config (strict mode)
│       └── src/
│           ├── main.tsx            # React entry point (Apollo Provider)
│           ├── App.tsx             # Router & layout setup
│           ├── types.ts            # Centralized TypeScript interfaces
│           ├── graphql/            # All GraphQL query/mutation definitions
│           ├── components/         # Shared UI components
│           ├── layout/             # App shell (sidebar, header)
│           ├── utils/              # Auth helpers, date utils, export utils
│           ├── constants/          # App-wide constants
│           └── pages/              # Feature pages (Controller + Sections pattern)
│               ├── dashboard.tsx
│               ├── Login.tsx
│               ├── EmployeeManagement/
│               │   ├── index.tsx              # Controller: state, queries, logic
│               │   └── components/sections/   # Sections: UI-only presentational
│               ├── EmployeeDetail/
│               │   ├── index.tsx              # Controller: state, queries, logic
│               │   └── components/
│               │       ├── tabs/       # Summary, Attendance, Movements, Leaves, Documents, Events
│               │       ├── modals/     # Apply Leave, Apply Movement, Attendance modals
│               │       └── HeaderSection.tsx
│               ├── Leave/
│               │   ├── index.tsx              # Controller
│               │   └── components/sections/   # Sections
│               ├── MovementRegister/
│               │   ├── index.tsx              # Controller
│               │   └── components/sections/   # Sections
│               ├── Relieving/
│               │   ├── index.tsx              # Controller
│               │   └── components/sections/   # Sections
│               ├── Reports.tsx
│               ├── Settings/
│               ├── Holidays.tsx
│               ├── EmployeeOnboarding.tsx
│               └── EventRegister.tsx
│
├── package.json                    # Root monorepo config (npm workspaces)
├── .husky/                         # Git hooks (pre-commit)
└── .lintstagedrc                   # Lint-staged configuration
```

### Backend Module Pattern

Each backend module follows a consistent structure:

```
module/
├── model.js        # Mongoose schema & model
├── typeDefs.js     # GraphQL type definitions
├── resolvers.js    # GraphQL resolvers (queries & mutations)
└── service.js      # Business logic layer
```

### Frontend Page Pattern (Controller + Sections)

All complex pages follow a **Controller + Sections** architecture:

```
Page/
├── index.tsx                    # CONTROLLER — owns all state, GraphQL, business logic
└── components/
    ├── sections/                # SECTIONS — pure UI, receive data via props only
    │   ├── HeaderSection.tsx
    │   ├── FilterSection.tsx
    │   ├── TableSection.tsx
    │   └── PaginationSection.tsx
    └── modals/                  # Modal dialogs — receive callbacks via props
```

- **`index.tsx`** = the "brain" — handles `useState`, `useQuery`, `useMutation`, filtering, sorting, pagination
- **`sections/`** = the "skin" — receives everything via props, renders UI only, zero business logic
- **Never** put GraphQL queries or state management inside section components

---

## 📦 Module Overview

### 🧑‍💼 Employee Management
Full employee lifecycle management with personal details, work details (department, designation, reporting manager), and document uploads. Supports search, filtering, pagination, and bulk operations. Admin and HOD views with department-scoped data isolation.

### 📊 Attendance
Monthly attendance calendar with day-level status tracking (Present, Absent, Half Day, On Leave, Week Off). Supports session-level timing (Check In, Intermediate, Check Out), shift configuration, biometric ID mapping, and bulk status updates by Admin/HOD.

### 📝 Leave Management
Multi-type leave system (Casual, Sick, Earned, etc.) with configurable quotas. Includes daily breakdown (Full Day / Half Day Morning / Afternoon), approval workflows, balance tracking, and leave history with status filtering.

### 🚶 Movement Register
Tracks employee movements in/out of office with analog time picker for precise time entry. Records movement type, purpose, duration, and approval status. Supports Admin/HOD approval and rejection workflows.

### 🚪 Relieving & Exit
End-to-end exit management — from resignation submission through clearance, settlement verification, exit interview, to final relieving. Includes notice period calculation, department-wise clearance tracking, and rehire capability.

### 📈 Reports
PDF report generation engine using Puppeteer + Handlebars templates. Supports:
- **Attendance Reports** — Daily/monthly attendance summaries
- **Leave Reports** — Daily leave snapshots, leave balance summaries
- **Movement Reports** — Daily movement register
- **System Reports** — Audit trail exports

### 📋 Event Register
Comprehensive audit trail capturing all system actions (create, update, delete, login, status changes) with user, timestamp, module, and description. Supports filtering and search.

### ⚙️ Settings
Organization-level configuration including leave types, session timings, and appearance preferences. Role-scoped access (Admin-only for most settings; Employee/HOD see Appearance and Security only).

---

## 🔄 End-to-End Workflow (How Modules Connect)

### 1. 🔐 Login Flow

```
User enters credentials (Login.tsx)
  → Apollo useMutation (LOGIN_USER)
    → Backend loginUser resolver
      → auth/service.js validates against MongoDB
        → JWT token generated with { userId, role, tenantId }
          → Token stored in localStorage
            → Apollo httpLink attaches token to every request
              → auth middleware decodes token → injects user into GraphQL context
```

### 2. 🧑‍💼 Employee Flow

```
EmployeeManagement/index.tsx
  → useQuery(GET_EMPLOYEES) with filters
    → employee/resolvers.js → employee/service.js
      → MongoDB query (tenant-scoped)
        → Returns employee list → rendered in TableSection

Click employee row → navigates to EmployeeDetail/index.tsx
  → useQuery(GET_EMPLOYEE_BY_ID)
    → Loads tabs: Summary, Attendance, Leaves, Movements, Documents, Events
```

### 3. 📝 Leave Workflow

```
Employee clicks "Apply Leave"
  → Fills form in ApplyLeaveModal (type, dates, daily breakdown)
    → useMutation(APPLY_LEAVE)
      → leave/resolvers.js → leave/service.js
        → Validates against leave balance
          → Creates leave record (status: "Pending")
            → Admin/HOD sees pending leave in Leave/index.tsx
              → Approves/Rejects → UPDATE_LEAVE mutation
                → Status updated → balance adjusted → UI reflects change
```

### 4. 🚶 Movement Workflow

```
Employee clicks "Apply Movement"
  → Fills form in ApplyMovementModal (date, type, out/in time, purpose)
    → useMutation(CREATE_MOVEMENT)
      → movement/resolvers.js → movement/service.js
        → Creates movement record (status: "Pending")
          → Admin/HOD sees in MovementRegister/index.tsx
            → Approves/Rejects → UPDATE_MOVEMENT mutation
              → Status updated → UI reflects change
```

### 5. 🚪 Relieving Workflow

```
Admin initiates exit (Relieving/index.tsx)
  → Fills resignation form (employee, date, reason, notice period)
    → useMutation(CREATE_RELIEVING)
      → relieving/resolvers.js → relieving/service.js
        → Creates relieving record (status: "Pending Approval")
          → Approval Flow:
            "Pending Approval" → "Approved" → "Clearance In Progress" → "Relieved"
          → Settlement & clearance tracked per department
          → Exit interview logged
          → Employee marked as Relieved → can be Rehired if needed
```

### 6. 📈 Reports Flow

```
Admin selects report type in Reports.tsx
  → Chooses filters (date, department, type)
    → Clicks "Generate PDF"
      → REST call: POST /api/reports/generate
        → backend/reports/controller.js
          → reportEngine.js selects registry (attendance, leave, movement)
            → fetcher.js runs MongoDB queries
              → Handlebars template renders HTML
                → Puppeteer converts HTML → PDF buffer
                  → PDF sent as response → browser downloads file
```

---

## 📌 Design Principles

### Frontend

| Principle | Description |
|---|---|
| **Controller + Sections** | `index.tsx` owns logic; section components are pure UI |
| **Presentational Components** | Sections receive all data via props — no internal queries or side effects |
| **Centralized Types** | All shared interfaces live in `src/types.ts` |
| **Strict TypeScript** | `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters` enforced |
| **Type-Only Imports** | Types must use `import type { ... }` — enforced by `tsc` |
| **No Logic Duplication** | Business logic lives in `index.tsx` only; sections never duplicate it |
| **Prop-Driven Auth** | Auth flags (`isAdmin`, `isHod`) passed as props, not called inside children |

### Backend

| Principle | Description |
|---|---|
| **Service Layer Pattern** | Resolvers are thin — they delegate to services for all business logic |
| **Feature-Based Modules** | Each feature (leave, movement, etc.) is a self-contained folder |
| **Tenant Isolation** | Every query is scoped to `tenant_id` from JWT context |
| **Role-Based Filtering** | Resolvers check user role and scope data (Admin → all, HOD → department, Employee → self) |
| **Schema-First GraphQL** | Type definitions declared separately from resolvers |
| **No Direct DB in Resolvers** | Resolvers never call Mongoose directly — always through `service.js` |

---

## 🤖 How AI Should Understand This Project

### Quick Mental Model

```
Frontend (React)  = UI Layer ONLY — no business logic
Backend (Node.js) = ALL business logic, validation, and data access
Database (MongoDB) = Persistent storage, tenant-scoped
```

### Data Flow (Memorize This)

```
React Component → Apollo Client → GraphQL → Resolver → Service → MongoDB
```

### Key Rules for AI

1. **Frontend has zero business logic** — it only renders data and calls mutations
2. **All logic lives in `service.js`** files in the backend
3. **Resolvers are thin wrappers** — they extract context (user, tenant) and call services
4. **Multi-tenancy is enforced in the backend** — every query includes `tenant_id` from JWT
5. **Role-based access** is checked in resolvers before calling services:
   - `ADMIN` → sees all data
   - `HOD` → sees own department only
   - `EMPLOYEE` → sees own records only
6. **Types are centralized** in `frontend/hrms-frontend/src/types.ts` — never define ad-hoc interfaces
7. **Use `import type`** for any type-only imports (enforced by `verbatimModuleSyntax`)
8. **Never use `any`** — the ESLint rule `@typescript-eslint/no-explicit-any` is enforced

### Where to Find Things

| Looking for... | Go to... |
|---|---|
| GraphQL queries/mutations | `frontend/src/graphql/*.ts` |
| Shared TypeScript interfaces | `frontend/src/types.ts` |
| Page logic & state | `frontend/src/pages/*/index.tsx` |
| UI components | `frontend/src/pages/*/components/sections/` |
| Backend business logic | `backend/src/modules/*/service.js` |
| Database schemas | `backend/src/modules/*/model.js` |
| GraphQL schema definitions | `backend/src/modules/*/typeDefs.js` |
| Auth middleware | `backend/src/middleware/auth.js` |
| Report templates | `backend/src/modules/reports/templates/` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MongoDB Atlas** account (or local MongoDB instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/Dhanya-Revankar56/hrms_app.git
cd hrms_app

# Install all dependencies (root + workspaces)
npm install
```

### Running in Development

```bash
# Terminal 1 — Start the backend
cd backend
npm run dev
# → Server at http://localhost:5000
# → GraphQL Playground at http://localhost:5000/graphql

# Terminal 2 — Start the frontend
cd frontend/hrms-frontend
npm run dev
# → App at http://localhost:5173
```

### Production Build

```bash
# Frontend
cd frontend/hrms-frontend
npm run build
# → Output in dist/

# Backend
cd backend
npm start
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
JWT_SECRET=<your-jwt-secret>
```

### Frontend (`frontend/hrms-frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/graphql
```

---

## 🌐 Deployment

| Layer | Platform | URL Pattern |
|---|---|---|
| **Frontend** | Vercel | `hrms-app-*.vercel.app` |
| **Backend** | Render | `hrms-backend-*.onrender.com` |

### Vercel (Frontend)

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `frontend/hrms-frontend`

### Render (Backend)

- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

---

## ✅ Code Quality

| Tool | Scope | Command |
|---|---|---|
| **ESLint** | Frontend (TS/TSX) | `npm run lint` |
| **ESLint** | Backend (JS) | `npm run lint` |
| **Prettier** | All files | Auto-formatted on commit |
| **TypeScript** | Frontend | `tsc -b` (strict mode, `verbatimModuleSyntax`) |

### Pre-Commit Hooks

Husky + lint-staged runs automatically on `git commit`:
1. **Frontend**: ESLint fix on staged `.ts` / `.tsx` files
2. **Backend**: ESLint fix on staged `.js` files

### TypeScript Configuration

- `strict: true` — Full strict mode enabled
- `verbatimModuleSyntax: true` — Requires `import type` for type-only imports
- `noUnusedLocals: true` — No unused variables allowed
- `noUnusedParameters: true` — No unused parameters allowed

---

## 📄 License

ISC

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Dhanya-Revankar56">Dhanya Revankar</a>
</p>
