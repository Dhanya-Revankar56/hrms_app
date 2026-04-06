const mongoose = require("mongoose");
const { getTenantId } = require("../middleware/tenantContext");

/**
 * Enterprise Utility: Injects the current tenantId into the query filter.
 * Throws an error if the tenant context is missing (Fail-Fast).
 */
const withTenant = (filter = {}, req = null) => {
  // If req is provided, prioritize its tenantId (from middleware)
  const tenantId = req?.tenant_id || getTenantId();
  
  if (!tenantId) {
    throw new Error("Missing tenant context for multi-tenant query.");
  }

  // ✨ Zero-Trust Multi-Tenancy: Only filter by the strict tenant_id (ObjectId)
  let oid = tenantId;
  if (typeof tenantId === "string" && tenantId.length === 24) {
    try {
      oid = new mongoose.Types.ObjectId(tenantId);
    } catch (err) {
      console.warn("[TenantUtils] Failed to cast tenantId to ObjectId:", tenantId);
    }
  }

  return { 
    ...filter, 
    tenant_id: oid
  };
};

/**
 * Extract user ID from GraphQL context (Support various session layouts).
 */
const getUserIdFromCtx = (ctx) => {
  return ctx?.user?.id || ctx?.req?.user?.id || ctx?.user?._id;
};

/**
 * Refactored applyTenantFilter for services (Legacy compatibility)
 */
const applyTenantFilter = (filter) => {
  return withTenant(filter);
};

module.exports = {
  withTenant,
  applyTenantFilter,
  getUserIdFromCtx
};
