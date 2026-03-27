const Counter = require("./model");

/**
 * Gets the next sequential ID for a given model and institution.
 * Uses findOneAndUpdate with $inc to ensure atomicity and prevent duplicates.
 */
exports.getNextID = async (institution_id, model_name) => {
  const result = await Counter.findOneAndUpdate(
    { institution_id, model_name },
    { $inc: { sequence_value: 1 }, $set: { updated_at: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return result.sequence_value;
};
