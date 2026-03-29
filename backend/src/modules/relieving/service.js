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

const Employee = require("../employee/model");
const Leave = require("../leave/model");
const MovementRegister = require("../movement/model");
const eventLogService = require("../eventLog/service");

exports.createRelieving = async (data) => {
  const { institution_id, employee_id, reason } = data;
  
  // 1. Check if employee exists and isn't already relieved
  const emp = await Employee.findOne({ _id: employee_id, institution_id });
  if (!emp) throw new Error("Employee not found");
  if (emp.app_status === "relieved") throw new Error("Employee is already relieved");

  // 2. Save Relieving document with default status
  const record = new Relieving({ ...data, status: "Pending Approval" });
  const saved = await record.save();

  return saved.toObject();
};

exports.updateRelieving = async (id, data, institution_id) => {
  const existing = await Relieving.findOne({ _id: id, institution_id });
  if (!existing) throw new Error("Relieving record not found");

  const updated = await Relieving.findOneAndUpdate(
    { _id: id, institution_id },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();

  // 1. If status is "Relieved", perform side effects (Idempotent cleanup)
  if (updated.status === "Relieved") {
    const emp = await Employee.findOne({ _id: updated.employee_id, institution_id });
    if (emp) {
      emp.app_status = "relieved";
      emp.is_active = false;
      await emp.save();
    }

    // 2. Cancel ALL leaves for the relieved employee (except terminal ones)
    const cancelledLeaves = await Leave.updateMany(
      { 
        $or: [
          { employee_id: updated.employee_id },
          { employee_id: updated.employee_id.toString() }
        ],
        institution_id: updated.institution_id, 
        status: { $nin: ["cancelled", "rejected", "closed"] } 
      },
      { 
        $set: { 
          status: "cancelled",
          dept_admin_status: "cancelled",
          admin_status: "cancelled",
          admin_remarks: "Employee relieved from application - Automated Synchronization",
          admin_date: new Date(),
          "approvals.$[].status": "cancelled",
          "approvals.$[].remarks": "Cancelled due to employee relieving",
          "approvals.$[].updated_at": new Date()
        } 
      }
    );

    // 3. Cancel ALL movements for the relieved employee (except terminal ones)
    const cancelledMovements = await MovementRegister.updateMany(
      { 
        $or: [
          { employee_id: updated.employee_id },
          { employee_id: updated.employee_id.toString() }
        ],
        institution_id: updated.institution_id, 
        status: { $nin: ["cancelled", "rejected", "completed"] } 
      },
      { 
        $set: { 
          status: "cancelled",
          dept_admin_status: "cancelled",
          admin_status: "cancelled",
          admin_remarks: "Employee relieved from application - Automated Synchronization",
          admin_date: new Date()
        } 
      }
    );
      console.log(`Synchronization complete for employee ${updated.employee_id}. Leaves: ${cancelledLeaves.modifiedCount}, Movements: ${cancelledMovements.modifiedCount}`);
    }

    return updated;
};

exports.deleteRelieving = async (id, institution_id) => {
  const deleted = await Relieving.findOneAndDelete({ _id: id, institution_id });
  if (!deleted) throw new Error("Relieving record not found");
  return { success: true, message: "Relieving record deleted successfully" };
};
