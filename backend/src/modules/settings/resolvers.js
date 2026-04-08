const settingsService = require("./service");
const { requireRole } = require("../../middleware/auth");
const { withTenant } = require("../../utils/tenantUtils");
const Employee = require("../employee/model");
const Leave = require("../leave/model");
const Attendance = require("../attendance/model");
const MovementRegister = require("../movement/model");
const Holiday = require("../holiday/model");

// 🛡 Multi-Tenant Settings Resolvers
const resolvers = {
  Query: {
    settings: async (_, __, ctx) => {
      return await settingsService.getSettings();
    },
    dashboardStats: async (_, __, ctx) => {
      // 0. Get Active Employee IDs for filtering
      const activeEmployees = await Employee.find(withTenant({ is_active: true })).select("_id").lean();
      const activeEmpIds = activeEmployees.map(e => e._id);
      const totalEmployees = activeEmpIds.length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 1. On Leave Today
      const leavesToday = await Leave.find(withTenant({
        employee_id: { $in: activeEmpIds },
        status: { $in: ["approved", "Approved"] },
        from_date: { $lte: tomorrow },
        to_date: { $gte: today }
      })).populate({
        path: "employee_id",
        populate: { path: "work_detail.department" }
      }).lean();

      // ... mapper logic ...
      const onLeaveEmployees = leavesToday.map(l => ({
        id: l.employee_id?._id?.toString() || l._id.toString(),
        name: l.employee_id ? `${l.employee_id.first_name || ""} ${l.employee_id.last_name || ""}`.trim() : "Unknown",
        department: l.employee_id?.work_detail?.department?.name || "N/A",
        leave_type: l.leave_type
      }));

      // 2. Present Today
      const presentCount = await Attendance.countDocuments(withTenant({
        employee_id: { $in: activeEmpIds },
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["present", "late", "half_day"] }
      }));

      // 3. Pending Approvals
      const pendingLeaveEmpIds = await Leave.distinct("employee_id", withTenant({ 
        employee_id: { $in: activeEmpIds },
        status: { $in: ["pending", "Pending"] } 
      }));
      const pendingMovementEmpIds = await MovementRegister.distinct("employee_id", withTenant({ 
        employee_id: { $in: activeEmpIds },
        status: { $in: ["pending", "Pending"] } 
      }));
      
      const pendingLeavesCount = await Leave.countDocuments(withTenant({ 
        employee_id: { $in: activeEmpIds },
        status: { $in: ["pending", "Pending"] } 
      }));
      const pendingMovementsCount = await MovementRegister.countDocuments(withTenant({ 
        employee_id: { $in: activeEmpIds },
        status: { $in: ["pending", "Pending"] } 
      }));

      // ... set mapping ...
      const allPendingEmpIds = new Set([
        ...pendingLeaveEmpIds.map(id => id.toString()),
        ...pendingMovementEmpIds.map(id => id.toString())
      ]);

      // 4. Upcoming Holidays
      const upcomingHolidaysRaw = await Holiday.find(withTenant({
        is_active: true,
        date: { $gte: today }
      })).sort({ date: 1 }).limit(5).lean();

      return {
        totalEmployees,
        onLeaveToday: leavesToday.length,
        onLeaveEmployees,
        presentToday: presentCount,
        absentToday: Math.max(0, totalEmployees - presentCount - leavesToday.length),
        pendingApprovals: allPendingEmpIds.size,
        pendingLeaves: pendingLeavesCount,
        pendingMovements: pendingMovementsCount,
        upcomingHolidays: upcomingHolidaysRaw.map(h => {
          const hd = h.holiday_date || h.date;
          return {
            id: h._id.toString(),
            name: h.name,
            date: hd instanceof Date ? hd.toISOString() : new Date(hd).toISOString(),
            type: h.type || "public",
            description: h.description || ""
          };
        })
      };
    }
  },

  Mutation: {
    upsertSettings: async (_, { input }, ctx) => {
      requireRole(ctx.user, ["ADMIN"]);
      return await settingsService.updateSettings(input, ctx);
    },
    // Master Data Mutations
    upsertDepartment: async (_, { input }, ctx) => {
      return await settingsService.upsertMasterData("departments", input);
    },
    deleteDepartment: async (_, { id }, ctx) => {
      const result = await settingsService.deleteMasterData("departments", id);
      return !!result;
    },
    upsertDesignation: async (_, { input }, ctx) => {
      return await settingsService.upsertMasterData("designations", input);
    },
    deleteDesignation: async (_, { id }, ctx) => {
      const result = await settingsService.deleteMasterData("designations", id);
      return !!result;
    },
    upsertLeaveType: async (_, { input }, ctx) => {
      return await settingsService.upsertMasterData("leave_types", input);
    },
    deleteLeaveType: async (_, { id }, ctx) => {
      const result = await settingsService.deleteMasterData("leave_types", id);
      return !!result;
    },
    upsertEmployeeCategory: async (_, { input }, ctx) => {
      return await settingsService.upsertMasterData("employee_categories", input);
    },
    deleteEmployeeCategory: async (_, { id }, ctx) => {
      const result = await settingsService.deleteMasterData("employee_categories", id);
      return !!result;
    },
    upsertEmployeeType: async (_, { input }, ctx) => {
      return await settingsService.upsertMasterData("employee_types", input);
    },
    deleteEmployeeType: async (_, { id }, ctx) => {
      const result = await settingsService.deleteMasterData("employee_types", id);
      return !!result;
    },
  },

  Settings: {
    id: (parent) => parent._id?.toString() || parent.id,
    tenant_id: (parent) => parent.tenant_id?.toString() || parent.institution_id,
    departments: async (parent) => {
      return await settingsService.listMasterData("departments");
    },
    designations: async (parent) => {
      return await settingsService.listMasterData("designations");
    },
    leave_types: async (parent) => {
      return await settingsService.listMasterData("leave_types");
    },
    employee_categories: async (parent) => {
      return await settingsService.listMasterData("employee_categories");
    },
    employee_types: async (parent) => {
      return await settingsService.listMasterData("employee_types");
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
  MasterDataItem: {
    id: (parent) => parent._id?.toString() || parent.id,
  },
  LeaveType: {
    id: (parent) => parent._id?.toString() || parent.id,
    weekends_covered: (parent) => !!parent.weekends_covered,
    holiday_covered: (parent) => !!parent.holiday_covered,
    user_entry: (parent) => parent.user_entry !== false,
    balance_enabled: (parent) => parent.balance_enabled !== false,
    workload_interchange: (parent) => !!parent.workload_interchange,
    document_required: (parent) => !!parent.document_required,
    applicable_for: (parent) => parent.applicable_for || ["Male", "Female", "Other"],
    reset_cycle: (parent) => parent.reset_cycle || "yearly",
  },
};

module.exports = resolvers;
