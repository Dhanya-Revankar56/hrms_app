const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

/**
 * Runs a function within a specific tenant context.
 * Now takes a context object { tenantId, role } for granular control.
 */
const runWithTenant = (context, callback) => {
  // Support both old (just tenantId) and new (context object) calls
  const ctx = typeof context === "object" ? context : { tenantId: context };
  return storage.run(ctx, callback);
};

/**
 * Retrieves the current tenantId from the async storage.
 */
const getTenantId = () => {
  const ctx = storage.getStore();
  if (ctx && typeof ctx === "object" && "tenantId" in ctx) {
    return ctx.tenantId;
  }
  return ctx; // Legacy support
};

/**
 * Retrieves the current user role from the async storage.
 */
const getUserRole = () => {
  const ctx = storage.getStore();
  return ctx?.role || null;
};

/**
 * Enterprise Utility: Retrieves the current tenant info
 */
const getCurrentTenant = () => {
  const tenantId = getTenantId();
  if (!tenantId) return null;
  return { tenant_id: tenantId };
};

module.exports = {
  runWithTenant,
  getTenantId,
  getUserRole,
  getCurrentTenant
};
