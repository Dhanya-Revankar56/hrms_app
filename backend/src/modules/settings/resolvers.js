const settingsService = require("./service");

const requireTenant = (ctx) => {
  if (!ctx.institution_id) {
    throw new Error("Missing x-institution-id header.");
  }
  return ctx.institution_id;
};

const Employee = require("../employee/model");
const Leave = require("../leave/model");
const Attendance = require("../attendance/model");
const MovementRegister = require("../movement/model");
const Holiday = require("../holiday/model");

const resolvers = {
  Query: {
    settings: async (_, __, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.getSettings(institution_id);
    },
    dashboardStats: async (_, __, ctx) => {
      const institution_id = requireTenant(ctx);
      const totalEmployees = await Employee.countDocuments({ institution_id });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 1. On Leave Today
      const leavesToday = await Leave.find({
        institution_id,
        status: "approved",
        from_date: { $lte: tomorrow },
        to_date: { $gte: today }
      }).populate({
        path: "employee_id",
        populate: { path: "work_detail.department" }
      }).lean();

      const onLeaveEmployees = leavesToday.map(l => ({
        id: l.employee_id?._id?.toString() || l._id.toString(),
        name: l.employee_id ? `${l.employee_id.first_name} ${l.employee_id.last_name}` : "Unknown Employee",
        department: l.employee_id?.work_detail?.department?.name || "N/A",
        leave_type: l.leave_type
      }));

      // 2. Present Today (from Attendance)
      const presentCount = await Attendance.countDocuments({
        institution_id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["present", "late", "half_day"] }
      });

      // 3. Pending Approvals (Unique Employees with Pending Leaves or Movements)
      const pendingLeaveEmpIds = await Leave.distinct("employee_id", { institution_id, status: "pending" });
      const pendingMovementEmpIds = await MovementRegister.distinct("employee_id", { institution_id, status: "pending" });
      
      const pendingLeavesCount = await Leave.countDocuments({ institution_id, status: "pending" });
      const pendingMovementsCount = await MovementRegister.countDocuments({ institution_id, status: "pending" });

      // Combine and get unique employee IDs across both for the main "employees awaiting approval" count
      const allPendingEmpIds = new Set([
        ...pendingLeaveEmpIds.map(id => id.toString()),
        ...pendingMovementEmpIds.map(id => id.toString())
      ]);

      // 4. Upcoming Holidays (next 5 from today)
      const upcomingHolidaysRaw = await Holiday.find({
        institution_id,
        is_active: true,
        date: { $gte: today }
      }).sort({ date: 1 }).limit(5).lean();

      const upcomingHolidays = upcomingHolidaysRaw.map(h => ({
        id: h._id.toString(),
        name: h.name,
        date: h.date.toISOString(),
        type: h.type || "public",
        description: h.description || ""
      }));

      return {
        totalEmployees,
        onLeaveToday: leavesToday.length,
        onLeaveEmployees,
        presentToday: presentCount,
        absentToday: Math.max(0, totalEmployees - presentCount - leavesToday.length),
        pendingApprovals: allPendingEmpIds.size,
        pendingLeaves: pendingLeavesCount,
        pendingMovements: pendingMovementsCount,
        upcomingHolidays
      };
    }
  },

  Mutation: {
    upsertSettings: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertSettings(institution_id, input);
    },
    // Master Data Mutations
    upsertDepartment: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertMasterData(institution_id, "departments", input);
    },
    deleteDepartment: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.deleteMasterData(institution_id, "departments", id);
    },
    upsertDesignation: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertMasterData(institution_id, "designations", input);
    },
    deleteDesignation: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.deleteMasterData(institution_id, "designations", id);
    },
    upsertLeaveType: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertMasterData(institution_id, "leave_types", input);
    },
    deleteLeaveType: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.deleteMasterData(institution_id, "leave_types", id);
    },
    upsertEmployeeCategory: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertMasterData(institution_id, "employee_categories", input);
    },
    deleteEmployeeCategory: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.deleteMasterData(institution_id, "employee_categories", id);
    },
    upsertEmployeeType: async (_, { input }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.upsertMasterData(institution_id, "employee_types", input);
    },
    deleteEmployeeType: async (_, { id }, ctx) => {
      const institution_id = requireTenant(ctx);
      return await settingsService.deleteMasterData(institution_id, "employee_types", id);
    },
  },

  Settings: {
    id: (parent) => parent._id.toString(),
    departments: async (parent) => {
      const items = await settingsService.listMasterData(parent.institution_id, "departments");
      return items.map(d => ({
        id: d._id.toString(),
        name: d.name,
        short_name: d.short_name,
        description: d.description,
        is_active: d.is_active
      }));
    },
    designations: async (parent) => {
      const items = await settingsService.listMasterData(parent.institution_id, "designations");
      return items.map(d => ({
        id: d._id.toString(),
        name: d.name,
        short_name: d.short_name,
        description: d.description,
        is_active: d.is_active
      }));
    },
    leave_types: async (parent) => {
      const items = await settingsService.listMasterData(parent.institution_id, "leave_types");
      return items.map(d => ({
        id: d._id.toString(),
        name: d.name,
        code: d.code,
        total_days: d.total_days || 0,
        max_per_request: d.max_per_request || 0,
        max_consecutive_leaves: d.max_consecutive_leaves || 0,
        days_before_apply: d.days_before_apply || 0,
        max_consecutive_days: d.max_consecutive_days || 0,
        weekends_covered: !!d.weekends_covered,
        holiday_covered: !!d.holiday_covered,
        user_entry: d.user_entry !== false,
        balance_enabled: d.balance_enabled !== false,
        workload_interchange: !!d.workload_interchange,
        document_required: !!d.document_required,
        leave_category: d.leave_category || "paid",
        applicable_for: d.applicable_for || ["Male", "Female", "Other"],
        reset_cycle: d.reset_cycle || "yearly",
        description: d.description,
        is_active: d.is_active
      }));
    },
    employee_categories: async (parent) => {
      const items = await settingsService.listMasterData(parent.institution_id, "employee_categories");
      return items.map(d => ({
        id: d._id.toString(),
        name: d.name,
        short_name: d.short_name,
        description: d.description,
        is_active: d.is_active
      }));
    },
    employee_types: async (parent) => {
      const items = await settingsService.listMasterData(parent.institution_id, "employee_types");
      return items.map(d => ({
        id: d._id.toString(),
        name: d.name,
        short_name: d.short_name,
        description: d.description,
        is_active: d.is_active
      }));
    },
    movement_settings: (parent) => {
      const ms = parent.movement_settings || {};
      return {
        limit_count: ms.limit_count ?? 4,
        limit_frequency: ms.limit_frequency || "Weekly",
        max_duration_mins: ms.max_duration_mins ?? 60,
        days_before_apply: ms.days_before_apply ?? 4,
        user_entry: ms.user_entry !== false,
        limit_enabled: ms.limit_enabled !== false
      }
    }
  },
};

module.exports = resolvers;
