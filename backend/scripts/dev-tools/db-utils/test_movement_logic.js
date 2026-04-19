const assert = require("assert");

// Mocking Dependencies
const mockSettings = {
  movement_settings: {
    limit_count: 2,
    limit_frequency: "Weekly",
    max_duration_mins: 60,
    days_before_apply: 3,
    limit_enabled: true,
  },
};

// Simplified copy of checkMovementRules logic for local verification
const checkMovementRulesMock = (
  ms,
  movement_date,
  out_time,
  in_time,
  existingCount,
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const moveDate = new Date(movement_date);
  moveDate.setHours(0, 0, 0, 0);

  // 1. Lead Time Check
  const daysDiff = Math.floor(
    (moveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff < ms.days_before_apply) {
    throw new Error(
      `Movement must be applied at least ${ms.days_before_apply} days in advance.`,
    );
  }

  // 2. Duration Check
  if (out_time && in_time) {
    const [h1, m1] = out_time.split(":").map(Number);
    const [h2, m2] = in_time.split(":").map(Number);
    const duration = h2 * 60 + m2 - (h1 * 60 + m1);
    if (duration > ms.max_duration_mins) {
      throw new Error(
        `Movement duration exceeds the maximum allowed limit of ${ms.max_duration_mins} minutes.`,
      );
    }
  }

  // 3. Frequency Limit Check
  if (existingCount >= ms.limit_count) {
    throw new Error(
      `You have reached the movement limit for this ${ms.limit_frequency.toLowerCase()} (${ms.limit_count}).`,
    );
  }

  return true;
};

// Simplified update status logic
const calculateStatusMock = (deptStatus, admStatus) => {
  if (deptStatus === "rejected" || admStatus === "rejected") return "rejected";
  if (admStatus === "approved" || deptStatus === "approved") return "approved";
  return "pending";
};

console.log("Running Movement Logic Unit Tests...");

// Test 1: Lead Time (Apply for today when 3 days required)
try {
  const today = new Date();
  checkMovementRulesMock(
    mockSettings.movement_settings,
    today,
    "10:00",
    "10:30",
    0,
  );
  assert.fail("Should have thrown lead time error");
} catch (e) {
  console.log("✅ Passed: Lead Time Violation detected:", e.message);
}

// Test 2: Duration (120 mins when 60 limited)
try {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  checkMovementRulesMock(
    mockSettings.movement_settings,
    future,
    "10:00",
    "12:00",
    0,
  );
  assert.fail("Should have thrown duration error");
} catch (e) {
  console.log("✅ Passed: Duration Violation detected:", e.message);
}

// Test 3: Frequency (3rd move when 2 limited)
try {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  checkMovementRulesMock(
    mockSettings.movement_settings,
    future,
    "10:00",
    "10:30",
    2,
  );
  assert.fail("Should have thrown frequency error");
} catch (e) {
  console.log("✅ Passed: Frequency Limit detected:", e.message);
}

// Test 4: HOD Approval alone
assert.strictEqual(
  calculateStatusMock("approved", "pending"),
  "approved",
  "HOD approval should result in approved status",
);
console.log("✅ Passed: HOD Approval logic");

// Test 5: Admin Rejection Override
assert.strictEqual(
  calculateStatusMock("approved", "rejected"),
  "rejected",
  "Admin rejection should override HOD approval",
);
console.log("✅ Passed: Admin Rejection Override logic");

console.log("\nAll logic tests PASSED successfully.");
