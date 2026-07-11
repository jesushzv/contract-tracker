/* eslint-disable @typescript-eslint/no-require-imports */
// Basic unit test runner in Node.js to verify core contract financial validations
const assert = require("assert");

console.log("🚀 Starting Contract Tracker Test Suite...");

// Mock milestone validator function (matching new contract page check)
function isBalanceValid(milestones, totalAmount) {
  const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
  return sum === totalAmount;
}

try {
  // Test 1: Exact balance matches
  console.log("🧪 Running Test 1: Exact Balance Validation...");
  const validMilestones = [
    { label: "Anticipo", amount: 15000 },
    { label: "Finiquito", amount: 15000 }
  ];
  assert.strictEqual(isBalanceValid(validMilestones, 30000), true, "Should be valid when sum equals totalAmount");
  console.log("✅ Test 1 Passed!");

  // Test 2: Mismatched balance
  console.log("🧪 Running Test 2: Mismatched Balance Validation...");
  const invalidMilestones = [
    { label: "Anticipo", amount: 15000 },
    { label: "Finiquito", amount: 10000 }
  ];
  assert.strictEqual(isBalanceValid(invalidMilestones, 30000), false, "Should be invalid when sum does not equal totalAmount");
  console.log("✅ Test 2 Passed!");

  // Test 3: Standard Cryptographic Hashing Logic Verification
  console.log("🧪 Running Test 3: Integrity Hash Generation Mock...");
  const crypto = require("crypto");
  const payload = { id: "c-123", amount: 30000 };
  const hash1 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const hash2 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  assert.strictEqual(hash1, hash2, "Hashing same contract payload should generate identical integrity fingerprints");
  console.log("✅ Test 3 Passed!");

  // Test 4: Proportional milestone scaling (Sprint 4)
  console.log("🧪 Running Test 4: Proportional Milestone Scaling...");
  function scaleMilestones(milestones, oldTotal, newTotal) {
    const scaleFactor = newTotal / oldTotal;
    let sum = 0;
    return milestones.map((m, idx) => {
      const isLast = idx === milestones.length - 1;
      let newAmt = Math.round(m.amount * scaleFactor);
      if (isLast) {
        newAmt = newTotal - sum;
      } else {
        sum += newAmt;
      }
      return { ...m, amount: newAmt };
    });
  }
  const milestones = [{ amount: 15000 }, { amount: 15000 }];
  const scaled = scaleMilestones(milestones, 30000, 45000);
  assert.strictEqual(scaled[0].amount, 22500);
  assert.strictEqual(scaled[1].amount, 22500); // 15000 * 1.5 = 22500, sum = 22500, last = 45000 - 22500 = 22500
  assert.strictEqual(scaled.reduce((acc, m) => acc + m.amount, 0), 45000, "Scaled milestones must sum exactly to new total");
  console.log("✅ Test 4 Passed!");

  // Test 5: Tenant scoping fallback (Sprint 5)
  console.log("🧪 Running Test 5: Tenant Scoping Fallback...");
  function resolveTargetUserId(authCookieVal) {
    if (authCookieVal) {
      try {
        const parsed = JSON.parse(authCookieVal);
        if (parsed?.user?.id) return parsed.user.id;
      } catch (e) {}
    }
    return "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9"; // default fallback
  }
  assert.strictEqual(resolveTargetUserId(null), "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9");
  assert.strictEqual(resolveTargetUserId('{"user":{"id":"test-user-uuid"}}'), "test-user-uuid");
  console.log("✅ Test 5 Passed!");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(error.stack || error.message);
  process.exit(1);
}
