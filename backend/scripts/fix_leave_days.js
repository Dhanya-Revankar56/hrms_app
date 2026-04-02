const mongoose = require("mongoose");
const Leave = require("../src/modules/leave/model");
const Settings = require("../src/modules/settings/model");
const LeaveType = require("../src/modules/settings/leaveType.model");
const Holiday = require("../src/modules/holiday/model");

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const MONGO_URI = "mongodb://dhanyavernekar_db_user:Dhanya56@ac-nityc8t-shard-00-00.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-01.t9urwje.mongodb.net:27017,ac-nityc8t-shard-00-02.t9urwje.mongodb.net:27017/hrms?ssl=true&replicaSet=atlas-e1h2nh-shard-0&authSource=admin&retryWrites=true&w=majority";

async function fixLeaveDays() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGO_URI, { family: 4 });
  console.log("✅ Connected.");

  const leaves = await Leave.find({});
  console.log(`Found ${leaves.length} leave records.`);

  const settingsCache = {};
  const leaveTypeCache = {};

  const getHolidaysInRange = async (institution_id, from, to) => {
    return await Holiday.find({
      institution_id,
      is_active: true,
      date: { $gte: from, $lte: to }
    }).lean();
  };

  const isHolidayOrSunday = (date, settings, publicHolidays = []) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const isOffDay = !settings.working_days.includes(dayName);
    const isExplicitHoliday = publicHolidays.some(h => 
      new Date(h.date).toDateString() === d.toDateString()
    );
    return isOffDay || isExplicitHoliday;
  };

  const calculateWorkingDays = (from, to, settings, options = {}, publicHolidays = []) => {
    const { weekends_covered = false, holiday_covered = false } = options;
    let count = 0;
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
      const isHoliday = isHolidayOrSunday(current, settings, publicHolidays);
      if (!isHoliday) {
        count++;
      } else {
        const d = new Date(current);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        const isWeekend = !settings.working_days.includes(dayName);
        if (isWeekend && weekends_covered) count++;
        else if (!isWeekend && holiday_covered) count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  let fixedCount = 0;

  for (const leave of leaves) {
    const instId = leave.institution_id;
    if (!settingsCache[instId]) {
      settingsCache[instId] = await Settings.findOne({ institution_id: instId });
    }
    const settings = settingsCache[instId];
    if (!settings) continue;

    const ltKey = `${instId}_${leave.leave_type.toLowerCase()}`;
    if (!leaveTypeCache[ltKey]) {
      leaveTypeCache[ltKey] = await LeaveType.findOne({ institution_id: instId, name: leave.leave_type.toLowerCase() });
    }
    const ltConfig = leaveTypeCache[ltKey];
    if (!ltConfig) continue;

    const from = new Date(leave.from_date);
    const to = new Date(leave.to_date);
    const publicHolidays = await getHolidaysInRange(instId, from, to);

    let totalDays = calculateWorkingDays(from, to, settings, {
      weekends_covered: ltConfig.weekends_covered,
      holiday_covered: ltConfig.holiday_covered
    }, publicHolidays);

    if (leave.is_half_day) totalDays = 0.5;

    if (leave.total_days !== totalDays) {
      console.log(`Fixing leave ${leave._id}: ${leave.total_days} -> ${totalDays} (${leave.leave_type})`);
      leave.total_days = totalDays;
      await leave.save();
      fixedCount++;
    }
  }

  console.log(`✅ Done. Fixed ${fixedCount} records.`);
  process.exit(0);
}

fixLeaveDays().catch(err => {
  console.error(err);
  process.exit(1);
});
