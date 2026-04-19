# Backend Scripts

This directory houses all administrative, utility, and tooling scripts necessary for managing and diagnosing the core database infrastructure. It is strictly organized to prevent execution of obsolete or unsafe code.

## Folder Overview

### 1. `db/` (Production & Infrastructure)
Contains critical scripts involved in the initial setup or persistent state migrations of the database.
- **`seed/`**: 
  Houses all database seeders (`seed.js`, `seed-superadmin.js`, etc.). Used primarily during a fresh installation or deployment sequence to bootstrap initial administrative roles, default types, and critical application settings.
- **`migrations/`**:
  Contains purely sequential data migrations (`001_`, `002_`, etc.). These scripts modify historic schemas during major version upgrades (e.g., nesting designations, upgrading to strict multi-tenancy rules). Always run these sequentially in chronological node execution if recovering a database.

### 2. `dev-tools/` (Development & Diagnostics)
Houses logic necessary to safely debug, inspect, or manually repair issues throughout the HRMS stack. **None of these are required to run in production**, but they provide safety levers when debugging issues locally.
- **`api-tests/`**: Basic endpoint pingers and GraphQL schema testing.
- **`db-utils/`**: Maintenance scripts for flushing zombie processes, repairing missing auth links, or rebuilding complex tenant hierarchies.
- **`diagnostics/`**: One-off local environment checks (such as verifying institution scoping logic on old objects).
- **`dangerous/`**: **⚠️ PROCEED WITH EXTREME CAUTION.** Scripts within this folder (such as `reset_employees.js`) execute highly destructive Mongo operations (`deleteMany()`, drops, etc.). They should *never* be run against a production Atlas cluster under any circumstances.

### 3. `archive/`
Contains outdated algorithms, historic iteration checks, or deeply hardcoded one-off query extractions that are mathematically obsolete (e.g., duplicated `reconcile` attempts superseded by new logic). Due to our zero-data-loss policy, no script is permanently stripped from the server—they are simply deposited here.

## Execution Instructions

When running scripts from this folder, do so from the `hrms_app/backend/` root directory to ensure `process.env` paths execute relative to the core configuration:

### Bootstrapping Defaults (Seeds)
\`\`\`bash
cd backend
node scripts/db/seed/seed.js
node scripts/db/seed/seed-superadmin.js
\`\`\`

### Running Migrations
If an upgrade instruction informs you to migrate schemas, run sequentially:
\`\`\`bash
cd backend
node scripts/db/migrations/001_migrate_designations.js
# ... proceed upwards if needed
\`\`\`
