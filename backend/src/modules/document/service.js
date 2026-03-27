const EmployeeDocument = require("./model");

const getEmployeeDocuments = async (employee_id, institution_id) => {
  return await EmployeeDocument.find({ employee_id, institution_id }).sort({ created_at: -1 });
};

const uploadDocument = async (input, institution_id) => {
  return await EmployeeDocument.create({ ...input, institution_id });
};

const deleteDocument = async (id, institution_id) => {
  const res = await EmployeeDocument.deleteOne({ _id: id, institution_id });
  return { success: res.deletedCount > 0, message: res.deletedCount > 0 ? "Document deleted" : "NotFound" };
};

module.exports = {
  getEmployeeDocuments,
  uploadDocument,
  deleteDocument
};
