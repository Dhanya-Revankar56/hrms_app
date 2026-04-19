# 🖥️ HRMS Frontend — React UI Layer

The user-facing interface of the HRMS platform. Built with React, TypeScript, and Vite, communicating with the backend exclusively through GraphQL via Apollo Client. Implements a **Controller + Sections** architecture for clean separation of logic and presentation.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Data Flow](#-data-flow)
- [GraphQL Integration](#-graphql-integration)
- [Routing](#-routing)
- [Example Flow](#-example-flow)
- [TypeScript Conventions](#-typescript-conventions)
- [Design Principles](#-design-principles)
- [Running the Frontend](#-running-the-frontend)

---

## 🔍 Overview

| Aspect | Detail |
|---|---|
| **Role** | UI layer only — zero business logic |
| **Framework** | React 19 |
| **Language** | TypeScript (strict mode) |
| **Build Tool** | Vite 7 |
| **API Communication** | Apollo Client → GraphQL |
| **Styling** | Vanilla CSS (no frameworks) |
| **Architecture** | Feature-based, Controller + Sections pattern |

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **TypeScript** | Static typing and compile-time safety |
| **Vite 7** | Dev server with HMR and production bundler |
| **Apollo Client** | GraphQL client (queries, mutations, caching) |
| **React Router v7** | Client-side routing and navigation |
| **Vanilla CSS** | Custom styles — no Tailwind, Bootstrap, or CSS-in-JS |

---

## 🏗 Architecture

### Controller + Sections Pattern

Every complex page follows this architecture:

```
Page/
├── index.tsx                    ← CONTROLLER (the "brain")
└── components/
    ├── sections/                ← SECTIONS (the "skin")
    │   ├── HeaderSection.tsx
    │   ├── FilterSection.tsx
    │   ├── StatsSection.tsx
    │   ├── TableSection.tsx
    │   └── PaginationSection.tsx
    └── modals/                  ← MODALS (overlay dialogs)
        ├── ApplyLeaveModal.tsx
        └── ApplyMovementModal.tsx
```

### Layer Responsibilities

| Layer | File | What It Does |
|---|---|---|
| **Controller** | `index.tsx` | Owns all state, GraphQL queries/mutations, filtering, sorting, pagination |
| **Section** | `components/sections/*.tsx` | Pure UI — receives data and callbacks via props, renders HTML |
| **Modal** | `components/modals/*.tsx` | Form dialogs — receives form state and submit handlers via props |

### Key Rules

- ✅ **Controller** handles `useState`, `useQuery`, `useMutation`, `useMemo`
- ✅ **Sections** only receive props and render UI
- ❌ **Sections never** import GraphQL queries or manage state
- ❌ **Sections never** call auth utilities directly — receive `isAdmin`/`isHod` as boolean props
- ❌ **Never** duplicate logic between controller and sections

---

## 📂 Folder Structure

```
src/
├── main.tsx              # React entry point (Apollo Provider, Router)
├── App.tsx               # Route definitions and layout setup
├── types.ts              # ALL shared TypeScript interfaces (centralized)
├── index.css             # Global styles
├── App.css               # App-level styles
│
├── graphql/              # GraphQL query & mutation definitions
│   ├── employeeQueries.ts
│   ├── attendanceQueries.ts
│   ├── leaveQueries.ts
│   ├── movementQueries.ts
│   ├── relievingQueries.ts
│   ├── documentQueries.ts
│   ├── eventLogQueries.ts
│   └── settingsQueries.ts
│
├── components/           # Shared reusable components
│   └── AnalogTimePicker.tsx
│
├── layout/               # App shell (sidebar, header, navigation)
│
├── utils/                # Utility functions
│   ├── auth.ts           # isAdmin(), isHod(), hasRole() helpers
│   ├── dateUtils.ts      # Date formatting and conversion
│   └── exportUtils.ts    # CSV/Excel export helpers
│
├── constants/            # App-wide constants
│
└── pages/                # Feature pages (Controller + Sections)
    ├── dashboard.tsx                  # Dashboard with stats
    ├── Login.tsx                      # Login page
    ├── EmployeeManagement/            # Employee list & management
    │   ├── index.tsx                  # Controller
    │   └── components/sections/       # Sections
    ├── EmployeeDetail/                # Single employee view (tabbed)
    │   ├── index.tsx                  # Controller
    │   └── components/
    │       ├── tabs/                  # Tab panels (Summary, Attendance, etc.)
    │       ├── modals/                # Apply Leave, Apply Movement, etc.
    │       └── HeaderSection.tsx      # Employee header card
    ├── Leave/                         # Leave management
    │   ├── index.tsx                  # Controller
    │   └── components/sections/       # Sections
    ├── MovementRegister/              # Movement tracking
    │   ├── index.tsx                  # Controller
    │   └── components/sections/       # Sections
    ├── Relieving/                     # Exit & relieving workflow
    │   ├── index.tsx                  # Controller
    │   └── components/sections/       # Sections
    ├── Reports.tsx                    # Report generation (PDF)
    ├── Settings/                      # Org settings
    ├── Holidays.tsx                   # Holiday calendar
    ├── EmployeeOnboarding.tsx         # New employee onboarding
    ├── EventRegister.tsx              # Audit trail viewer
    └── attendance.tsx                 # Attendance overview
```

### Folder Roles

| Folder | Purpose |
|---|---|
| `pages/` | Feature modules — each page is a self-contained module |
| `graphql/` | All GraphQL query and mutation definitions (gql tagged templates) |
| `components/` | Shared UI components used across multiple pages |
| `layout/` | App shell — sidebar, top bar, navigation structure |
| `utils/` | Pure utility functions — auth checks, date formatting, exports |
| `constants/` | Static values — menu items, role names, status labels |
| `types.ts` | Single source of truth for all TypeScript interfaces |

---

## 🔄 Data Flow

### Read Flow (Queries)

```
User navigates to page
  → Controller (index.tsx) mounts
    → useQuery(GET_DATA) fires via Apollo Client
      → GraphQL request sent to backend (:5000)
        → Backend resolver → service → MongoDB
          → Response returned to Apollo Client
            → Controller receives data via hook
              → Passes data as props to Sections
                → Sections render UI
```

### Write Flow (Mutations)

```
User fills form in Section/Modal
  → Calls callback prop (e.g., onSubmit)
    → Controller handles via useMutation(CREATE_DATA)
      → GraphQL mutation sent to backend
        → Backend processes → returns result
          → Apollo cache updated
            → Controller state updates
              → Sections re-render with new data
```

### State Management

- **No Redux / Zustand** — all state is local (`useState` in controllers)
- **Apollo Client cache** handles server-state synchronization
- **Props-only** communication between controller and sections

---

## 🔌 GraphQL Integration

### Query/Mutation Definitions

All GraphQL operations are defined in `src/graphql/` as tagged template literals:

```typescript
// src/graphql/leaveQueries.ts
import { gql } from "@apollo/client/core";

export const GET_LEAVES = gql`
  query GetLeaves($employee_id: String, $status: String) {
    leaves(employee_id: $employee_id, status: $status) {
      items {
        id
        leave_type
        from_date
        to_date
        status
      }
    }
  }
`;

export const APPLY_LEAVE = gql`
  mutation ApplyLeave($input: LeaveInput!) {
    applyLeave(input: $input) {
      id
      status
    }
  }
`;
```

### Usage in Controllers

```typescript
// Inside index.tsx (controller)
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_LEAVES, APPLY_LEAVE } from "../../graphql/leaveQueries";

const { data, loading } = useQuery(GET_LEAVES, {
  variables: { employee_id: id },
  fetchPolicy: "network-only",
});

const [applyLeave] = useMutation(APPLY_LEAVE, {
  refetchQueries: [{ query: GET_LEAVES }],
});
```

### Rules

- ✅ Queries/mutations defined in `graphql/*.ts` — never inline in components
- ✅ Used via `useQuery` / `useMutation` in controllers only
- ❌ Never call GraphQL from section components

---

## 🗺 Routing

Routing is defined in `App.tsx` using React Router v7:

```
/login              → Login.tsx
/dashboard          → dashboard.tsx
/employees          → EmployeeManagement/index.tsx
/employee/:id       → EmployeeDetail/index.tsx
/attendance         → attendance.tsx
/leave              → Leave/index.tsx
/movement           → MovementRegister/index.tsx
/relieving          → Relieving/index.tsx
/reports            → Reports.tsx
/settings           → Settings/index.tsx
/holidays           → Holidays.tsx
/onboarding         → EmployeeOnboarding.tsx
/events             → EventRegister.tsx
```

### Route Protection

- All routes except `/login` require authentication
- Auth state checked via `localStorage` (JWT token)
- Role-based rendering: some UI elements hidden based on `isAdmin()` / `isHod()`

---

## 📝 Example Flow — Leave Module

### 1. Page Load

```
User navigates to /leave
  → Leave/index.tsx mounts (Controller)
    → useQuery(GET_LEAVES) fetches all leave records
      → Data returned → stored in local state
        → Passed to LeaveTableSection as props
          → Table renders leave records with status badges
```

### 2. Apply Leave

```
User clicks "Apply Leave"
  → Controller opens ApplyLeaveModal (showModal = true)
    → User fills: leave type, from/to date, daily breakdown, reason
      → Clicks "Submit"
        → Controller calls useMutation(APPLY_LEAVE)
          → Backend validates → creates record (status: "Pending")
            → Apollo refetches GET_LEAVES
              → Table updates with new pending leave
```

### 3. Admin Approves

```
Admin sees pending leave in table
  → Clicks "Approve"
    → Controller calls useMutation(UPDATE_LEAVE, { status: "Approved" })
      → Backend updates record + adjusts leave balance
        → UI refreshes → status badge changes to "Approved"
```

---

## 📐 TypeScript Conventions

### Centralized Types

All shared interfaces live in `src/types.ts`:

```typescript
export interface Employee { id: string; first_name: string; ... }
export interface Leave    { id: string; leave_type: string; status: string; ... }
export interface Movement { id: string; movement_type: string; ... }
```

### Import Rules

```typescript
// ✅ Correct — type-only import (required by verbatimModuleSyntax)
import type { Employee, Leave } from "../../types";

// ❌ Wrong — will cause TS1484 error
import { Employee, Leave } from "../../types";
```

### Strict Mode

| Rule | Effect |
|---|---|
| `strict: true` | Full strict checking enabled |
| `verbatimModuleSyntax: true` | Must use `import type` for types |
| `noUnusedLocals: true` | No unused variables |
| `noUnusedParameters: true` | No unused function parameters |
| `no-explicit-any` (ESLint) | Never use `any` — always define proper types |

---

## 📌 Design Principles

| Principle | How It's Applied |
|---|---|
| **Separation of Concerns** | Controllers handle logic; Sections handle UI |
| **Presentational Components** | Sections are pure — props in, JSX out |
| **Feature-Based Architecture** | Each page is a self-contained module with its own components |
| **Centralized Types** | All interfaces in `types.ts` — no ad-hoc definitions |
| **Prop-Driven Communication** | Data flows down via props; events flow up via callbacks |
| **No Logic Duplication** | Business logic lives in controllers only |
| **Type-Safe Development** | Strict TypeScript enforced at build time |
| **Minimal Shared State** | `useState` in controllers + Apollo cache — no global store |

---

## 🚀 Running the Frontend

### Install

```bash
cd frontend/hrms-frontend
npm install
```

### Development

```bash
npm run dev
# → http://localhost:5173 (Vite default)
# → Hot Module Replacement enabled
```

### Production Build

```bash
npm run build
# → tsc -b (TypeScript check) + vite build
# → Output in dist/
```

### Lint

```bash
npm run lint
# → ESLint checks all .ts / .tsx files
```

---

<p align="center">
  Part of the <a href="../../README.md">HRMS Application</a> monorepo
</p>
