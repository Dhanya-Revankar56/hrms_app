const mongoose = require("mongoose");
const { getTenantId, getUserRole } = require("./tenantContext");

/**
 * Mongoose Tenant Plugin (Enterprise Grade)
 * Enforces tenant_id isolation at the database level with Fail-Fast security.
 */
const tenantPlugin = (schema) => {
  // 🛡 0. Check if Model supports multi-tenancy
  if (!schema.paths.tenant_id) {
    return;
  }
  
  // Hardcoded System ID for global orchestration
  const SYSTEM_TENANT_ID = "69d347b23110bafa43c51532"; 

  // 🛡 1. Filter Handlers: For find, update, and delete methods
  const applyTenantFilter = function (next) {
    if (this.getOptions().skipTenant || this.getOptions().bypassTenant) {
      return next();
    }

    // 🛡 2. SUPER ADMIN Bypass (Only for Global/System view)
    const role = getUserRole();
    const tenantId = getTenantId();
    
    // Convert to string for robust comparison (handles ObjectIds)
    const tenantIdStr = tenantId ? tenantId.toString() : null;
    const isGlobalView = !tenantIdStr || tenantIdStr === SYSTEM_TENANT_ID;

    if (role === "SUPER_ADMIN" && isGlobalView) {
      return next();
    }

    if (!tenantId) {
      return next(new Error("CRITICAL SECURITY ERROR: Missing tenant context for database operation."));
    }

    // ✨ Force cast to ObjectId for strict matching in pre-hooks
    try {
      const oid = new mongoose.Types.ObjectId(tenantId);
      this.where({ tenant_id: oid });
    } catch (err) {
      return next(new Error("CRITICAL SECURITY ERROR: Invalid tenant ID format."));
    }
    next();
  };

  const queryMethods = [
    "find", "findOne", "countDocuments", "estimatedDocumentCount",
    "updateOne", "updateMany", "deleteOne", "deleteMany",
    "findOneAndUpdate", "findOneAndRemove", "findOneAndDelete",
  ];

  queryMethods.forEach((method) => {
    schema.pre(method, applyTenantFilter);
  });

  // 🛡 2. Aggregate Handler: Zero Leakage for Pipelines
  schema.pre("aggregate", function (next) {
    const role = getUserRole();
    const tenantId = getTenantId();
    
    // Robust comparison for the aggregate hook as well
    const tenantIdStr = tenantId ? tenantId.toString() : null;
    const isGlobalView = !tenantIdStr || tenantIdStr === SYSTEM_TENANT_ID;
    
    // 🛡 Bypassing for explicit system operations or Super Admin Global View
    if (this.options.skipTenant || this.options.bypassTenant || (role === "SUPER_ADMIN" && isGlobalView)) {
      return next();
    }

    if (!tenantId) {
      return next(new Error("CRITICAL SECURITY ERROR: Missing tenant context for aggregation."));
    }

    let oid;
    try {
      oid = new mongoose.Types.ObjectId(tenantId);
    } catch (err) {
      return next(new Error("CRITICAL SECURITY ERROR: Invalid tenant ID format in aggregate."));
    }

    const pipeline = this.pipeline();

    // Helper to inject $match into any pipeline stage array
    const injectTenantToPipeline = (stages) => {
      // Always match at the start
      stages.unshift({ $match: { tenant_id: oid } });

      // Recursively handle nested pipelines ($lookup, $facet, $unionWith)
      stages.forEach(stage => {
        if (stage.$lookup && stage.$lookup.pipeline) {
          injectTenantToPipeline(stage.$lookup.pipeline);
        }
        if (stage.$facet) {
          Object.values(stage.$facet).forEach(facetPipeline => {
            injectTenantToPipeline(facetPipeline);
          });
        }
        if (stage.$unionWith && stage.$unionWith.pipeline) {
          injectTenantToPipeline(stage.$unionWith.pipeline);
        }
      });
    };

    injectTenantToPipeline(pipeline);
    next();
  });

  // Helper handler for save/validate
  const injectTenantForSave = function (next) {
    if (this.isNew || this.isModified("tenant_id")) {
      const tenantId = getTenantId();
      const role = getUserRole();
      const tenantIdStr = tenantId ? tenantId.toString() : null;
      
      // Super Admin can save without specific tenant if in Global mode
      if (role === "SUPER_ADMIN" && (!tenantIdStr || tenantIdStr === SYSTEM_TENANT_ID) && !this.tenant_id) {
          return next();
      }
      
      if (!this.tenant_id && !tenantId) {
        return next(new Error("CRITICAL SECURITY ERROR: Cannot save document without tenant_id."));
      }

      if (!this.tenant_id) {
         this.tenant_id = tenantId;
      }
    }
    next();
  };

  schema.pre("validate", injectTenantForSave);
  schema.pre("save", injectTenantForSave);
};

tenantPlugin.applyTenantPlugin = tenantPlugin;
module.exports = tenantPlugin;
