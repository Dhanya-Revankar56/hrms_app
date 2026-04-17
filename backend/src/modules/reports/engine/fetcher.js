/**
 * 🔧 FETCHER
 * Resolves the Mongoose model from the report config by name,
 * applies .populate(), .sort(), and .limit() from the config,
 * and returns a lean array of documents.
 *
 * This is the only place that talks to MongoDB — keeping the
 * engine, normalizer, and renderer all pure and testable.
 */

/**
 * Central model registry — maps model name strings to Mongoose models.
 * Add new models here as you add new report categories.
 */
const MODEL_MAP = {
  Employee: () => require("../../employee/model"),
  Attendance: () => require("../../attendance/model"),
  Leave: () => require("../../leave/model"),
  LeaveBalance: () => require("../../leave/leaveBalance"),
  MovementRegister: () => require("../../movement/model"),
  EventLog: () => require("../../eventLog/model"),
  AuditLog: () => require("../../audit/model"),
  Holiday: () => require("../../holiday/model"),
  Department: () => require("../../settings/department.model"),
  Relieving: () => require("../../relieving/model"),
};

/**
 * Resolve a model name string → Mongoose Model instance.
 */
const resolveModel = (modelName) => {
  const loader = MODEL_MAP[modelName];
  if (!loader) {
    throw new Error(
      `[Fetcher] Unknown model name in report config: "${modelName}"`,
    );
  }
  return loader();
};

/**
 * Fetch documents from MongoDB using a report config + pre-built filter.
 *
 * @param {Object} config - Report config from registry
 * @param {Object} filter - Pre-built MongoDB filter (from queryEngine)
 * @returns {Array}       - Lean Mongoose documents
 */
const fetchData = async (config, filter) => {
  const Model = resolveModel(config.model);

  let query = Model.find(filter).setOptions({ skipTenant: true });

  // 🛡 Recursive populate helper to ensure all sub-queries use skipTenant: true
  const applyPopulate = (q, popList) => {
    if (!popList) return q;
    for (const pop of popList) {
      const options = {
        path: pop.path,
        select: pop.select,
        options: { skipTenant: true },
      };
      // If there's nested populate, handle it recursively
      if (pop.populate) {
        options.populate = Array.isArray(pop.populate)
          ? pop.populate.map((p) => ({ ...p, options: { skipTenant: true } }))
          : { ...pop.populate, options: { skipTenant: true } };
      }
      q = q.populate(options);
    }
    return q;
  };

  // Apply populate with recursion support
  query = applyPopulate(query, config.populate);

  // Apply sort
  if (config.sortBy) {
    query = query.sort({ [config.sortBy.field]: config.sortBy.order ?? -1 });
  }

  // Apply result limit (default 2000 safety cap)
  const limit = config.limit ?? 2000;
  query = query.limit(limit);

  return query.lean();
};

module.exports = { fetchData, resolveModel };
