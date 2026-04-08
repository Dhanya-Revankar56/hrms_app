const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

/**
 * Runs a function within a specific tenant context.
 * All downstream calls (including Mongoose hooks) can access the tenantId.
 */
const runWithTenant = (tenantId, callback) => {
  return storage.run(tenantId, callback);
};

/**
 * Retrieves the current tenantId from the async storage.
 */
const getTenantId = () => {
  return storage.getStore();
};

/**
 * Enterprise Utility: Retrieves the current tenant info (could be expanded)
 */
const getCurrentTenant = () => {
  const tenantId = getTenantId();
  if (!tenantId) return null;
  return { tenant_id: tenantId };
};

module.exports = {
  runWithTenant,
  getTenantId,
  getCurrentTenant
};
