const Relieving = require("./model");

exports.listRelievings = async ({ institution_id, employee_id, status, pagination }) => {
  const filter = { institution_id };
  if (employee_id) filter.employee_id = employee_id;
  if (status) filter.status = status;

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([
    Relieving.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Relieving.countDocuments(filter)
  ]);

  return {
    items,
    pageInfo: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page * limit < totalCount
    }
  };
};

exports.getRelievingById = async (id, institution_id) => {
  const rec = await Relieving.findOne({ _id: id, institution_id }).lean();
  if (!rec) throw new Error("Relieving record not found");
  return rec;
};

exports.createRelieving = async (data) => {
  const record = new Relieving(data);
  const saved = await record.save();
  return saved.toObject();
};

exports.updateRelieving = async (id, data, institution_id) => {
  const updated = await Relieving.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw new Error("Relieving record not found");
  return updated;
};

exports.deleteRelieving = async (id, institution_id) => {
  const deleted = await Relieving.findOneAndDelete({ _id: id, institution_id });
  if (!deleted) throw new Error("Relieving record not found");
  return { success: true, message: "Relieving record deleted successfully" };
};
