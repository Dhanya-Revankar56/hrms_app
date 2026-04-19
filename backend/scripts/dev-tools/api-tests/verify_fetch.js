const mongoose = require("mongoose");
const { AsyncLocalStorage } = require("async_hooks");

// Mock tenantContext
const storage = new AsyncLocalStorage();
const getTenantId = () => storage.getStore();

// Mock withTenant
const withTenant = (filter) => {
  const tid = getTenantId();
  if (tid) filter.tenant_id = new mongoose.Types.ObjectId(tid);
  return filter;
};

async function test() {
  await mongoose.connect("mongodb://localhost:27017/hrms");

  // Test User: dhanyavernekar@gmail.com
  const user = await mongoose.connection.db
    .collection("users")
    .findOne({ email: "dhanyavernekar@gmail.com" });
  const tenantId = user.tenant_id.toString();
  console.log("Testing with Tenant ID:", tenantId);

  storage.run(tenantId, async () => {
    // 1. Test Holidays
    const Holiday = mongoose.model(
      "Holiday",
      new mongoose.Schema({
        tenant_id: mongoose.Schema.Types.ObjectId,
        date: Date,
        is_active: Boolean,
      }),
    );
    const holidayFilter = withTenant({ is_active: true });
    const holidays = await Holiday.find(holidayFilter).lean();
    console.log("Holidays found for tenant:", holidays.length);
    if (holidays.length > 0) console.log("Sample Holiday:", holidays[0]);

    // 2. Test Relieving
    // Resolve Employee ID first
    const Employee = mongoose.model(
      "Employee",
      new mongoose.Schema({
        user_id: mongoose.Schema.Types.ObjectId,
        tenant_id: mongoose.Schema.Types.ObjectId,
      }),
    );
    const emp = await Employee.findOne(
      withTenant({ user_id: user._id }),
    ).lean();
    console.log("Employee found for user:", emp ? emp._id : "NONE");

    const Relieving = mongoose.model(
      "Relieving",
      new mongoose.Schema({
        employee_id: mongoose.Schema.Types.ObjectId,
        tenant_id: mongoose.Schema.Types.ObjectId,
      }),
    );
    if (emp) {
      const relievingFilter = withTenant({ employee_id: emp._id });
      const relievings = await Relieving.find(relievingFilter).lean();
      console.log("Relievings found for employee:", relievings.length);
    }

    await mongoose.disconnect();
  });
}

test().catch(console.error);
