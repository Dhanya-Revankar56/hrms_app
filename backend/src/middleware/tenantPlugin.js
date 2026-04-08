const mongoose = require("mongoose");
const { getTenantId } = require("./tenantContext");

/**
 * Mongoose Tenant Plugin (Enterprise Grade)
 * Enforces tenant_id isolation at the database level with Fail-Fast security.
 */
const tenantPlugin = (schema) => {
  
  // 🛡 1. Filter Handlers: For find, update, and delete methods
  const applyTenantFilter = function (next) {
    // 🏷 Bypassing for explicit system operations (e.g., Login)
    if (this.getOptions().skipTenant || this.getOptions().bypassTenant) {
      return next();
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error("CRITICAL SECURITY ERROR: Missing tenant context for database operation."));
    }

    // ✨ Force cast to ObjectId for strict matching in pre-hooks
    try {
      const oid = new mongoose.Types.ObjectId(tenantId);
      this.where({ tenant_id: oid });
    } catch (err) {
      console.error("[TenantPlugin Error] Invalid tenant ID format in filter:", tenantId);
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
    if (this.options.skipTenant || this.options.bypassTenant) {
      return next();
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error("CRITICAL SECURITY ERROR: Missing tenant context for aggregation."));
    }

    let oid;
    try {
      oid = new mongoose.Types.ObjectId(tenantId);
    } catch (err) {
      console.error("[TenantPlugin Error] Invalid tenant ID format in aggregate:", tenantId);
      return next(new Error("CRITICAL SECURITY ERROR: Invalid tenant ID format."));
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
      
      // If manually set (e.g. migration), skip context check but validate value exists
      if (!this.tenant_id && !tenantId) {
        return next(new Error("CRITICAL SECURITY ERROR: Cannot save document without tenant_id."));
      }

      if (!this.tenant_id) {
         this.tenant_id = tenantId;
      }
    }
    next();
  };

  // 🛡 3. Save/Create Handler: Ensure no document is saved without tenant_id
  schema.pre("validate", injectTenantForSave);
  schema.pre("save", injectTenantForSave);
};

// Export both the main plugin and a named helper for better compatibility with different import styles
tenantPlugin.applyTenantPlugin = tenantPlugin;
module.exports = tenantPlugin;
