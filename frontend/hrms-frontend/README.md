# HRMS — Schema-Driven Development Platform
# Architecture, Design & Technical Documentation

> **Human Resource Management System**
> A serverless, schema-driven, multi-tenant HR platform built with React, TypeScript, and AWS Lambda — designed for rapid module generation and enterprise scalability.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Schema-Driven Development Approach](#3-schema-driven-development-approach)
4. [Current Frontend Architecture](#4-current-frontend-architecture)
5. [Architecture Limitations of the Current State](#5-architecture-limitations-of-the-current-state)
6. [Backend Integration Strategy](#6-backend-integration-strategy)
7. [Lambda-Based Backend Architecture](#7-lambda-based-backend-architecture)
8. [YAML Module Generation System](#8-yaml-module-generation-system)
9. [Enterprise Folder Structure](#9-enterprise-folder-structure)
10. [Multi-Institution (Multi-Tenant) Design](#10-multi-institution-multi-tenant-design)
11. [Static vs Dynamic Data Strategy](#11-static-vs-dynamic-data-strategy)
12. [Code Generation Workflow](#12-code-generation-workflow)
13. [Module Architecture](#13-module-architecture)
14. [Production Readiness Enhancements](#14-production-readiness-enhancements)
15. [Future Enhancements](#15-future-enhancements)
16. [Modules Implemented](#16-modules-implemented)
17. [Conclusion](#17-conclusion)

---

## 1. Project Overview

The **Human Resource Management System (HRMS)** is designed as a **schema-driven development platform** — a structural framework where application modules are not hand-coded one at a time, but instead **generated automatically** from declarative YAML schema definitions.

This platform fundamentally changes the development workflow:

| Traditional Approach | Schema-Driven Approach |
|---|---|
| Developer manually writes page, component, service, type, Lambda | Developer writes a YAML schema file |
| Each module takes days to build | New module generated in seconds |
| Inconsistent code style per developer | Uniform, template-driven output |
| Backend and frontend built separately | Both generated from a single source of truth |

The system serves multiple HR operational areas — employee management, attendance, leave, movement, and offboarding — while being architected to support multiple institutions concurrently through a multi-tenant data model.

---

## 2. Technology Stack

### Frontend

| Area | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 18 | Component-based view layer |
| **Language** | TypeScript | Static typing and interface contracts |
| **Build Tool** | Vite | Fast development server and optimized build |
| **Routing** | React Router DOM v6 | Client-side navigation and route guards |
| **State Management** | Zustand | Lightweight global store for auth and tenant context |
| **Data Fetching** | TanStack Query (React Query) | Server state, caching, background sync |
| **HTTP Client** | Axios | Configured client with request interceptors |
| **Code Generation** | Node.js + js-yaml + Handlebars | Parses YAML and renders code templates |

### Backend

| Area | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20 (TypeScript) | Lambda function execution |
| **Hosting** | AWS Lambda | Serverless compute |
| **API Layer** | AWS API Gateway | HTTP routing to Lambda functions |
| **Database** | Amazon DynamoDB | NoSQL operational data store |
| **Settings DB** | Amazon RDS (PostgreSQL) | Relational store for institutional master data |
| **Auth** | AWS Cognito | Authentication, JWT management, multi-tenant user pools |
| **Infrastructure** | AWS CDK / Serverless Framework | IaC for API routes, Lambda configs, permissions |
| **Validation** | Zod | Schema validation at Lambda boundary |
| **Logging** | AWS CloudWatch | Structured Lambda execution logs |

---

## 3. Schema-Driven Development Approach

### 3.1 The Core Philosophy

The central idea of this platform is that a **YAML file is the single source of truth** for an entire module. From one schema file, the code generator produces all necessary frontend and backend artifacts, eliminating boilerplate and enforcing consistency.

```
YAML Schema
     │
     ├──▶ Frontend Feature Module
     │       ├── TypeScript Types
     │       ├── API Service
     │       ├── Custom Hook
     │       ├── Data Table Component
     │       ├── Form Component
     │       └── Page Component
     │
     ├──▶ Backend Lambda Functions
     │       ├── createRecord.ts
     │       ├── getRecords.ts
     │       ├── updateRecord.ts
     │       └── deleteRecord.ts
     │
     ├──▶ Database Schema
     │       └── DynamoDB table definition / RDS migration
     │
     └──▶ Infrastructure Configuration
             ├── API Gateway routes
             ├── Lambda permissions
             └── IAM role policies
```
 ## 3.2 Architecture Ratings

Scalability: 4/10

Reason: As more modules (e.g., Payroll, Appraisals, Recruitment) are added, the src/pages/ folder will become completely unmanageable. There is no domain-driven isolation.

Maintainability: 5/10

Reason: Types and components are loosely scattered. Finding the associated components, hooks, and types for a specific feature requires navigating through cluttered, generic folders.

Code Organization: 4/10

Reason: Incorrect placement of files (
EmployeeTable.tsx
 inside pages/ instead of components/), inconsistent casing conventions, and blurred lines between domain logic and presentation.

Component Structure: 5/10

Reason: The settings/ area attempts grouping, which is good, but global components lack isolation. Reusability is hampered because components are tightly coupled to their page views.

State Management: 6/10

Reason: Currently relies on local component state and custom hooks (
useEmployees.ts

). This works for a prototype, but an HRMS needs global state (e.g., authenticated user session, selected institution context, global permissions) which is currently absent.

### 3.2 YAML Schema Design

Each module is described by a YAML file that specifies its fields, data types, validation rules, UI labels, and permissions.

**Example: `schemas/employee.yaml`**

```yaml
module:
  name: Employee
  slug: employee
  type: dynamic           # dynamic = operational record | static = master config
  icon: users
  description: Core employee record management

fields:
  - name: employeeId
    type: string
    generated: true       # Auto-generated, not entered by user
    label: Employee ID

  - name: fullName
    type: string
    required: true
    label: Full Name
    ui:
      component: TextInput
      placeholder: Enter full name

  - name: department
    type: reference
    ref: Department         # References a static institutional table
    required: true
    label: Department
    ui:
      component: Select

  - name: designation
    type: reference
    ref: Designation
    required: true
    label: Designation
    ui:
      component: Select

  - name: dateOfJoining
    type: date
    required: true
    label: Date of Joining
    ui:
      component: DatePicker

  - name: employmentType
    type: enum
    values: [Full-Time, Part-Time, Contract, Intern]
    required: true
    label: Employment Type
    ui:
      component: Select

  - name: status
    type: enum
    values: [Active, Inactive, On-Leave, Relieved]
    default: Active
    label: Status

permissions:
  create: [HR_ADMIN, HR_MANAGER]
  read:   [HR_ADMIN, HR_MANAGER, EMPLOYEE]
  update: [HR_ADMIN, HR_MANAGER]
  delete: [HR_ADMIN]

api:
  endpoints:
    - GET    /employees
    - POST   /employees
    - GET    /employees/{id}
    - PUT    /employees/{id}
    - DELETE /employees/{id}

menu:
  label: Employee Management
  section: Operations
  order: 1
```

---

## 4. Current Frontend Architecture

The current frontend is a functional SPA with all core HR modules implemented. It uses a standard file-type–based folder structure and relies on static mock data.

### Entry Flow

```
main.tsx
  └── App.tsx  (React Router)
        ├── /login → Login.tsx
        └── /app/* → DashboardLayout.tsx
              ├── /dashboard        → dashboard.tsx
              ├── /employees        → EmployeeManagement.tsx
              ├── /onboarding       → EmployeeOnboarding.tsx
              ├── /attendance       → attendance.tsx
              ├── /leave            → leave.tsx
              ├── /movement         → movementRegister.tsx
              ├── /relieving        → relieving.tsx
              └── /settings         → Settings.tsx
```

### Current Folder Structure

```
hrms-frontend/
└── src/
    ├── assets/
    ├── components/
    │   ├── DashboardCards.tsx
    │   └── settings/
    │       ├── DepartmentSection.tsx
    │       ├── DesignationSection.tsx
    │       ├── EmployeeTypeSection.tsx
    │       ├── LeaveTypesSection.tsx
    │       └── SettingsSidebar.tsx
    ├── constants/          # Static dropdown data
    ├── data/               # Mock employee records
    ├── layout/
    │   ├── DashboardLayout.tsx
    │   └── Sidebar.tsx
    ├── pages/              # ⚠ Mixed: routes + components + hooks + types
    │   ├── hooks/useEmployees.ts
    │   ├── EmployeeTable.tsx
    │   ├── EmployeeToolbar.tsx
    │   ├── mockData.ts
    │   └── types.ts
    ├── types.ts
    └── App.tsx
```

---

## 5. Architecture Limitations of the Current State

| Problem | Impact |
|---|---|
| `pages/` mixes routes, hooks, and components | Unscalable; becomes a dumping ground as modules grow |
| No API / service layer | Cannot connect to backend without rewriting every component |
| No global state (auth, tenant) | Cannot enforce RBAC or multi-tenant context |
| Inconsistent naming (`attendance.tsx` vs `EmployeeManagement.tsx`) | Cognitive friction; tooling issues in case-sensitive environments |
| Scattered TypeScript types | Risk of type conflicts; difficult to refactor |
| Static mock data inside components | Data fetching logic will need to be embedded into UI code during backend integration |
| No feature isolation | Changes to one module can inadvertently break another |

---

## 6. Backend Integration Strategy

### 6.1 Axios Client with Interceptors

A singleton Axios instance is the central API communication layer. It automatically attaches authentication tokens and institution context to every outbound request.

```typescript
// src/lib/axiosClient.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Institution-ID'] = user.institutionId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout(); // Clear session, redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.2 TanStack Query Integration

All API calls are declared as `useQuery` / `useMutation` hooks using TanStack Query. This provides automatic caching, background refetching, loading/error states, and pagination — eliminating hundreds of lines of manual state management.

```typescript
// src/features/employee/hooks/useEmployees.ts
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employee.service';

export const useEmployees = (params: EmployeeQueryParams) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
```

---

## 7. Lambda-Based Backend Architecture

### 7.1 Lambda Organization

Each module receives its own dedicated Lambda function per CRUD operation. Functions are stateless and single-responsibility.

```
backend/
└── lambdas/
    ├── employee/
    │   ├── createEmployee.ts
    │   ├── getEmployees.ts
    │   ├── getEmployeeById.ts
    │   ├── updateEmployee.ts
    │   └── deleteEmployee.ts
    ├── attendance/
    │   ├── markAttendance.ts
    │   └── getAttendanceLogs.ts
    ├── leave/
    │   ├── applyLeave.ts
    │   ├── approveLeave.ts
    │   └── getLeaveRequests.ts
    ├── movement/
    │   └── logMovement.ts
    ├── relieving/
    │   └── processRelieving.ts
    └── settings/
        ├── departments/
        │   ├── createDepartment.ts
        │   └── getDepartments.ts
        ├── designations/
        └── leaveTypes/
```

### 7.2 Lambda Function Pattern

Every Lambda follows a uniform structure: parse and validate input → check permissions → execute business logic → return a standardized response.

```typescript
// backend/lambdas/employee/createEmployee.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { EmployeeSchema } from '../../schemas/employee.schema';
import { employeeRepository } from '../../repositories/employee.repository';
import { validatePermission } from '../../lib/auth';
import { response } from '../../lib/response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userRole = event.requestContext.authorizer?.role;
    validatePermission(userRole, 'employee:create');

    const body = JSON.parse(event.body ?? '{}');
    const validated = EmployeeSchema.parse(body);

    const institutionId = event.headers['x-institution-id'];
    const record = await employeeRepository.create({ ...validated, institutionId });

    return response.success(201, record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return response.validationError(error.errors);
    }
    return response.serverError(error);
  }
};
```

### 7.3 API Gateway Route Map

| Method | Route | Lambda | Permission |
|---|---|---|---|
| `GET` | `/employees` | `getEmployees` | `employee:read` |
| `POST` | `/employees` | `createEmployee` | `employee:create` |
| `GET` | `/employees/{id}` | `getEmployeeById` | `employee:read` |
| `PUT` | `/employees/{id}` | `updateEmployee` | `employee:update` |
| `DELETE` | `/employees/{id}` | `deleteEmployee` | `employee:delete` |
| `GET` | `/leave/requests` | `getLeaveRequests` | `leave:read` |
| `POST` | `/leave/apply` | `applyLeave` | `leave:apply` |
| `PATCH` | `/leave/{id}/approve` | `approveLeave` | `leave:approve` |

---

## 8. YAML Module Generation System

### 8.1 Generation Command

```bash
npm run generate -- --schema schemas/employee.yaml
```

### 8.2 Internal Generator Workflow

```
schemas/employee.yaml
       │
       ▼
 [1] YAML Parser (js-yaml)
       │  Reads and validates schema structure
       ▼
 [2] Template Engine (Handlebars)
       │  Selects templates for each artifact type
       ▼
 [3] File Writer
       │  Writes generated files to target directories
       ▼
 [4] Router Updater
       │  Appends route entry to routes.config.ts
       ▼
 [5] Sidebar Updater
       │  Appends menu entry to navigation config
       ▼
 [6] Index Updater
       │  Exports new module in feature index files
```

### 8.3 Templates

Templates are Handlebars files stored in `generators/templates/`. Each template receives the parsed YAML schema as its context object.

```
generators/
└── templates/
    ├── frontend/
    │   ├── page.tsx.hbs
    │   ├── types.ts.hbs
    │   ├── service.ts.hbs
    │   ├── hook.ts.hbs
    │   ├── DataTable.tsx.hbs
    │   └── Form.tsx.hbs
    ├── backend/
    │   ├── create.ts.hbs
    │   ├── getAll.ts.hbs
    │   ├── getById.ts.hbs
    │   ├── update.ts.hbs
    │   └── delete.ts.hbs
    └── infra/
        └── lambda.config.hbs
```

**Example: `generators/templates/frontend/types.ts.hbs`**

```handlebars
// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Source: schemas/{{module.slug}}.yaml

export interface {{module.name}} {
  id: string;
  {{#each fields}}
  {{name}}: {{tsType type}};
  {{/each}}
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Create{{module.name}}Payload {
  {{#each fields}}
  {{#unless generated}}
  {{name}}{{#unless required}}?{{/unless}}: {{tsType type}};
  {{/unless}}
  {{/each}}
}
```

### 8.4 Generator Script

```typescript
// generators/generate-module.ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { registerHelpers } from './helpers';

registerHelpers(Handlebars); // Register 'tsType', 'capitalize', etc.

async function generateModule(schemaPath: string) {
  const schema = yaml.load(fs.readFileSync(schemaPath, 'utf8')) as any;
  const { module } = schema;

  const artifacts = [
    { template: 'frontend/types.ts.hbs',   output: `frontend/src/features/${module.slug}/types/${module.slug}.types.ts` },
    { template: 'frontend/service.ts.hbs', output: `frontend/src/features/${module.slug}/services/${module.slug}.service.ts` },
    { template: 'frontend/hook.ts.hbs',    output: `frontend/src/features/${module.slug}/hooks/use${module.name}.ts` },
    { template: 'frontend/page.tsx.hbs',   output: `frontend/src/features/${module.slug}/pages/${module.name}Page.tsx` },
    { template: 'backend/create.ts.hbs',   output: `backend/lambdas/${module.slug}/create${module.name}.ts` },
    { template: 'backend/getAll.ts.hbs',   output: `backend/lambdas/${module.slug}/get${module.name}s.ts` },
    { template: 'backend/update.ts.hbs',   output: `backend/lambdas/${module.slug}/update${module.name}.ts` },
    { template: 'backend/delete.ts.hbs',   output: `backend/lambdas/${module.slug}/delete${module.name}.ts` },
  ];

  for (const { template, output } of artifacts) {
    const src = fs.readFileSync(path.join('generators/templates', template), 'utf8');
    const compiled = Handlebars.compile(src)(schema);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, compiled);
    console.log(`✅ Generated: ${output}`);
  }

  updateRouter(module);
  updateSidebar(module);
  console.log(`\n🎉 Module "${module.name}" fully generated.`);
}

generateModule(process.argv[2]);
```

---

## 9. Enterprise Folder Structure

```
hrms-platform/
│
├── schemas/                          # YAML schema definitions (source of truth)
│   ├── employee.yaml
│   ├── attendance.yaml
│   ├── leave.yaml
│   ├── movement.yaml
│   └── relieving.yaml
│
├── generators/                       # Code generation system
│   ├── generate-module.ts            # Main generation script
│   ├── helpers.ts                    # Handlebars custom helpers (tsType, etc.)
│   └── templates/
│       ├── frontend/
│       │   ├── page.tsx.hbs
│       │   ├── types.ts.hbs
│       │   ├── service.ts.hbs
│       │   ├── hook.ts.hbs
│       │   ├── DataTable.tsx.hbs
│       │   └── Form.tsx.hbs
│       └── backend/
│           ├── create.ts.hbs
│           ├── getAll.ts.hbs
│           └── delete.ts.hbs
│
├── frontend/                         # React + TypeScript SPA
│   └── src/
│       ├── assets/
│       ├── components/               # Globally shared UI
│       │   ├── ui/                   # Design system primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── DataTable.tsx
│       │   │   ├── Badge.tsx
│       │   │   └── Spinner.tsx
│       │   └── layout/
│       │       ├── DashboardLayout.tsx
│       │       ├── Sidebar.tsx
│       │       └── Header.tsx
│       ├── features/                 # Generated feature modules
│       │   ├── auth/
│       │   │   ├── pages/Login.tsx
│       │   │   ├── hooks/useAuth.ts
│       │   │   ├── services/auth.service.ts
│       │   │   └── types/auth.types.ts
│       │   ├── employee/
│       │   │   ├── components/
│       │   │   │   ├── EmployeeTable.tsx
│       │   │   │   └── EmployeeForm.tsx
│       │   │   ├── hooks/useEmployee.ts
│       │   │   ├── services/employee.service.ts
│       │   │   ├── types/employee.types.ts
│       │   │   └── pages/EmployeePage.tsx
│       │   ├── attendance/
│       │   ├── leave/
│       │   ├── movement/
│       │   ├── relieving/
│       │   └── settings/
│       ├── hooks/                    # Shared global hooks
│       │   ├── usePermissions.ts
│       │   ├── usePagination.ts
│       │   └── useDebounce.ts
│       ├── lib/
│       │   ├── axiosClient.ts
│       │   └── queryClient.ts
│       ├── routes/
│       │   ├── AppRouter.tsx
│       │   ├── PrivateRoute.tsx
│       │   └── routes.config.ts     # Auto-updated by generator
│       ├── store/
│       │   ├── authStore.ts
│       │   └── tenantStore.ts
│       ├── types/
│       │   ├── api.types.ts
│       │   └── global.types.ts
│       └── utils/
│           ├── formatDate.ts
│           └── validators.ts
│
├── backend/                          # Serverless Lambda backend
│   ├── lambdas/                      # Generated Lambda functions
│   │   ├── employee/
│   │   ├── attendance/
│   │   ├── leave/
│   │   └── settings/
│   ├── lib/
│   │   ├── auth.ts                   # JWT verification, role check
│   │   ├── response.ts               # Standardized response helpers
│   │   └── db.ts                     # DynamoDB / RDS connection
│   ├── repositories/                 # Data access layer
│   │   ├── employee.repository.ts
│   │   └── leave.repository.ts
│   ├── schemas/                      # Zod validation schemas
│   │   ├── employee.schema.ts
│   │   └── leave.schema.ts
│   └── middleware/
│       ├── authenticate.ts
│       └── rateLimiter.ts
│
└── infrastructure/                   # AWS CDK / Serverless config
    ├── serverless.yml
    ├── cdk/
    │   ├── lambdaStack.ts
    │   ├── apiGatewayStack.ts
    │   └── databaseStack.ts
    └── iam/
        └── policies/
```

---

## 10. Multi-Institution (Multi-Tenant) Design

### 10.1 Tenancy Model

Each institution is a distinct tenant with fully isolated data. The system uses a **shared infrastructure, isolated data** pattern.

```
AWS Cognito User Pool
       │
       ├── Institution A Pool
       │       └── Users: admin@institA.com, emp001@institA.com
       └── Institution B Pool
               └── Users: admin@institB.com, emp001@institB.com
```

### 10.2 JWT Claim Structure

Every authenticated user carries their institution context inside the JWT claims:

```json
{
  "sub": "user-uuid-123",
  "email": "hr@institution-a.com",
  "custom:institutionId": "inst_a_7f3k2",
  "custom:role": "HR_ADMIN",
  "exp": 1741617369
}
```

### 10.3 Frontend Tenant Context (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: { id: string; name: string; role: Role; institutionId: string } | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (token) => {
    const decoded = decodeJwt(token);
    set({ token, user: { ...decoded } });
  },
  logout: () => set({ user: null, token: null }),
}));
```

### 10.4 Role-Based Access Control (RBAC)

| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | Access across all institutions; manage institution registry |
| `HR_ADMIN` | Full module access within own institution |
| `HR_MANAGER` | Read/write for assigned departments only; cannot delete |
| `EMPLOYEE` | View own records; submit leave and attendance only |

Route-level guarding:

```typescript
// src/routes/PrivateRoute.tsx
const PrivateRoute = ({ requiredRole }: { requiredRole: Role }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(user.role, requiredRole)) return <Navigate to="/403" />;
  return <Outlet />;
};
```

Button-level guarding:

```typescript
// Usage anywhere in a component
const { can } = usePermissions();
{can('employee:delete') && <Button variant="danger">Delete</Button>}
```

### 10.5 Backend Data Isolation

All DynamoDB operations use a composite partition key: `PK = INST#{institutionId}#EMP#{employeeId}`. This guarantees physical data isolation at the database level.

```typescript
// In every repository function
const params = {
  TableName: 'HRMSData',
  Key: {
    PK: `INST#${institutionId}`,
    SK: `EMP#${employeeId}`,
  },
};
```

---

## 11. Static vs Dynamic Data Strategy

### 11.1 Static Institutional Data (Master Data → PostgreSQL / RDS)

These are configuration records that define an institution's organizational structure. They change infrequently and require relational querying.

| Table | Examples |
|---|---|
| `departments` | Administration, Finance, HR, IT |
| `designations` | Manager, Senior Engineer, Executive |
| `employee_types` | Permanent, Contract, Intern |
| `leave_types` | Annual Leave, Sick Leave, Casual Leave |
| `shifts` | Morning Shift (9AM–5PM), Night Shift |
| `academic_departments` | Science, Arts, Commerce |

These are managed through the **Settings module** in the frontend.

### 11.2 Dynamic Operational Data (Generated Modules → DynamoDB)

These are high-volume transactional records that grow continuously. They benefit from DynamoDB's horizontal scalability and flexible schemas.

| Module | Record Type |
|---|---|
| `employee` | Core employee profile records |
| `attendance` | Daily check-in / check-out logs |
| `leave` | Individual leave applications and approvals |
| `movement` | Movement register entries |
| `relieving` | Exit formality records |

---

## 12. Code Generation Workflow

The complete lifecycle of generating a new module, from YAML to running feature:

```
Step 1: Author  →  Write schemas/leave.yaml

Step 2: Terminal → npm run generate -- --schema schemas/leave.yaml

Step 3: Generator parses YAML
         ├── Validate schema structure
         └── Extract: module.name, fields[], permissions, api.endpoints

Step 4: Generate Frontend Artifacts
         ├── src/features/leave/types/leave.types.ts
         ├── src/features/leave/services/leave.service.ts
         ├── src/features/leave/hooks/useLeave.ts
         ├── src/features/leave/components/LeaveTable.tsx
         ├── src/features/leave/components/LeaveForm.tsx
         └── src/features/leave/pages/LeavePage.tsx

Step 5: Generate Backend Artifacts
         ├── backend/lambdas/leave/createLeave.ts
         ├── backend/lambdas/leave/getLeaves.ts
         ├── backend/lambdas/leave/updateLeave.ts
         └── backend/lambdas/leave/deleteLeave.ts

Step 6: Update Router
         └── Append { path: '/leave', component: LeavePage }
             to src/routes/routes.config.ts

Step 7: Update Sidebar
         └── Append { label: 'Leave Management', icon: 'calendar', path: '/leave' }
             to src/components/layout/navigation.config.ts

Step 8: Deploy Backend (optional flag)
         └── serverless deploy --function leave-create
```

---

## 13. Module Architecture

### 13.1 Feature Module Structure

Every generated or hand-crafted module follows the same internal structure:

```
features/employee/
├── components/
│   ├── EmployeeTable.tsx     # Data grid with pagination, sort, search
│   └── EmployeeForm.tsx      # Create / Edit form with validation
├── hooks/
│   └── useEmployee.ts        # useQuery + useMutation wrappers
├── services/
│   └── employee.service.ts   # All HTTP calls via axiosClient
├── types/
│   └── employee.types.ts     # TypeScript interfaces for this module
└── pages/
    └── EmployeePage.tsx      # Route-level container component
```

### 13.2 Service Layer Pattern

```typescript
// src/features/employee/services/employee.service.ts
import api from '@/lib/axiosClient';
import { Employee, CreateEmployeePayload } from '../types/employee.types';

export const employeeService = {
  getAll: (params: Record<string, any>) =>
    api.get<Employee[]>('/employees', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<Employee>(`/employees/${id}`).then(r => r.data),

  create: (payload: CreateEmployeePayload) =>
    api.post<Employee>('/employees', payload).then(r => r.data),

  update: (id: string, payload: Partial<CreateEmployeePayload>) =>
    api.put<Employee>(`/employees/${id}`, payload).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/employees/${id}`).then(r => r.data),
};
```

---

## 14. Production Readiness Enhancements

| Enhancement | Implementation |
|---|---|
| **Centralized Error Handling** | Axios response interceptor normalizes all errors; React Error Boundaries catch component failures |
| **Validation at Every Layer** | Zod schemas at Lambda input boundary; React Hook Form + Zod on frontend forms |
| **Structured Logging** | Lambda functions use `aws-lambda-powertools` for structured JSON logs in CloudWatch |
| **Audit Trails** | A dedicated `AuditLog` DynamoDB table captures every write operation: who, what, when, old value, new value |
| **Caching Strategy** | TanStack Query caches frontend data; API Gateway response caching for read-heavy endpoints; ElastiCache (Redis) for session tokens |
| **Rate Limiting** | API Gateway throttling per institution; Lambda middleware enforces per-user rate limits |
| **Event-Driven Architecture** | DynamoDB Streams trigger Lambda functions (e.g., on leave approval → send notification) |
| **Retry Logic** | Axios configured with exponential backoff on 5xx responses using `axios-retry` |
| **Environment Configuration** | All environment-specific values via `.env` files and AWS SSM Parameter Store |

---

## 15. Future Enhancements

| Module / Feature | Description |
|---|---|
| **Payroll Module** | Salary calculation, deductions, payslip PDF generation, tax filing |
| **Performance Appraisals** | KPI setting, review cycles, self-assessments, 360° feedback |
| **Recruitment Pipeline** | Job postings, applicant tracking, interview scheduling |
| **Real-Time Notifications** | WebSocket (API Gateway) push alerts for approvals and reminders |
| **Analytics Dashboard** | Attrition heatmaps, headcount forecasts, leave utilisation charts using Recharts |
| **Design System / Storybook** | Isolated component library with visual tests and usage documentation |
| **Offline Support (PWA)** | Service worker caching for attendance marking in low-connectivity environments |
| **Code Splitting (Lazy Load)** | `React.lazy()` per feature module reduces initial bundle size significantly |
| **Skeleton Loaders** | Placeholder UI components during data fetching for better perceived performance |
| **Biometric Integration** | Hardware attendance device data ingestion via IoT → Lambda pipeline |

---

## 16. Modules Implemented

| Module | Page File | Backend Status | Status |
|---|---|---|---|
| Authentication | `Login.tsx` | Pending Cognito Integration | ✅ UI Complete |
| Dashboard | `dashboard.tsx` | Pending | ✅ UI Complete |
| Employee Management | `EmployeeManagement.tsx` | Pending | ✅ UI Complete |
| Employee Onboarding | `EmployeeOnboarding.tsx` | Pending | ✅ UI Complete |
| Attendance | `attendance.tsx` | Pending | ✅ UI Complete |
| Leave Management | `leave.tsx` | Pending | ✅ UI Complete |
| Movement Register | `movementRegister.tsx` | Pending | ✅ UI Complete |
| Relieving | `relieving.tsx` | Pending | ✅ UI Complete |
| Settings — Departments | `DepartmentSection.tsx` | Pending | ✅ UI Complete |
| Settings — Designations | `DesignationSection.tsx` | Pending | ✅ UI Complete |
| Settings — Leave Types | `LeaveTypesSection.tsx` | Pending | ✅ UI Complete |
| Settings — Employee Types | `EmployeeTypeSection.tsx` | Pending | ✅ UI Complete |

---

## 17. Conclusion

The HRMS platform is designed as more than a single application — it is a **schema-driven development framework** that treats YAML definitions as the canonical source of truth for both frontend and backend code. This architectural decision delivers three strategic advantages:

1. **Development Velocity**: New HR modules (Payroll, Recruitment, Performance) can be introduced by writing a YAML file and running a single command, rather than days of manual implementation.

2. **Consistency**: Because all modules are generated from the same templates with enforced patterns, the codebase remains structurally uniform regardless of how many developers contribute or how many modules exist.

3. **Enterprise Readiness**: The combination of a serverless Lambda backend, DynamoDB with composite partition keys for tenant isolation, Cognito-managed multi-institution auth, and a feature-driven frontend architecture creates a system that is horizontally scalable, cost-efficient, and operationally maintainable.

The current frontend, with all core HR modules fully implemented, represents the working prototype layer. The next phase involves wiring those views to the serverless API layer, deploying the generator infrastructure, and enabling the multi-tenant Cognito user pools — at which point the platform transitions from a prototype to a production-deployable enterprise HRMS.

---

*Architecture documented as part of the HRMS Platform Engineering initiative — March 2026*
