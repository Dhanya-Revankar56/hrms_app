# Backend Utility Scripts

This directory contains maintenance, diagnostic, and migration tools used for managing the HRMS database. These scripts are independent of the core application runtime.

## Directory Structure

### 📁 diagnostics
Tools for checking data integrity and inspecting database records.
- `check_settings.js`: Lists all institutions and their IDs.
- `inspect_emp.js`: Shows full details for a specific employee.
- `check_emp_insts.js`: Validates institution IDs across employees.
- `search_campus_alpha.js`: Debug tool for filtering specific tenants.

### 📁 maintenance
Tools for correcting data and resetting system state.
- `reconcile.js`: Syncs department/designation strings to their respective ObjectIDs.
- `reset_employees.js`: **[CRITICAL]** Deletes all employee data and resets ID counters to EMP-001.
- `find_pending_leave.js`: Lists all leaves with "pending" status.
- `verify_migration.js`: Checks if all records are properly migrated after a schema change.

### 📁 migration
Core scripts for schema changes.
- `migrate-designations.js`: Initial migration for designation structure.
- `migrate-leavetypes.js`: Initial migration for custom leave types.

## Usage
To run any of these scripts, use `node` from the **backend root**:
```bash
node scripts/maintenance/reconcile.js
```
