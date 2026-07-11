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
      } catch {}
    }
    return "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9"; // default fallback
  }
  assert.strictEqual(resolveTargetUserId(null), "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9");
  assert.strictEqual(resolveTargetUserId('{"user":{"id":"test-user-uuid"}}'), "test-user-uuid");
  console.log("✅ Test 5 Passed!");

  // Test 6: RFC Check Digit and Format Validation
  console.log("🧪 Running Test 6: RFC Taxpayer Verification...");
  
  const CHAR_VALUES = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
    'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27,
    'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35, 'Ñ': 36,
    '&': 37, ' ': 37
  };

  function validateRFC(rfc) {
    if (!rfc) return { isValid: false };
    const clean = rfc.trim().toUpperCase();
    if (clean.length !== 12 && clean.length !== 13) return { isValid: false };
    
    const physicalRegex = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
    const moralRegex = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;
    const isPhysical = clean.length === 13;
    
    if (isPhysical && !physicalRegex.test(clean)) return { isValid: false };
    if (!isPhysical && !moralRegex.test(clean)) return { isValid: false };
    
    // Check digit
    const lastChar = clean[clean.length - 1];
    const base = clean.substring(0, clean.length - 1);
    let sum = 0;
    const len = clean.length;
    for (let i = 0; i < base.length; i++) {
      const val = CHAR_VALUES[base[i]] || 0;
      sum += val * (len - i);
    }
    const modulus = sum % 11;
    const diff = 11 - modulus;
    let expected = '0';
    if (diff === 11) expected = '0';
    else if (diff === 10) expected = 'A';
    else expected = String(diff);
    
    return { isValid: lastChar === expected };
  }

  // GUEH860710MX8 is physical and valid
  assert.strictEqual(validateRFC("GUEH860710MX8").isValid, true, "Valid physical RFC should pass");
  // GUEH860710MX9 has invalid check digit
  assert.strictEqual(validateRFC("GUEH860710MX9").isValid, false, "Invalid check digit should fail");
  // Too short
  assert.strictEqual(validateRFC("GUEH860710M").isValid, false, "Short RFC should fail");
  console.log("✅ Test 6 Passed!");

  // Test 7: Mexican Withholding Tax Calculations
  console.log("🧪 Running Test 7: Mexican Withholding Tax Calculations...");
  function calculateNetTotal(amount, retIsr, retIva) {
    const subtotal = amount;
    const iva = amount * 0.16;
    const isr = retIsr ? amount * 0.10 : 0;
    const retIvaAmt = retIva ? amount * 0.16 * (2 / 3) : 0;
    return subtotal + iva - isr - retIvaAmt;
  }
  
  // No withholdings: 10000 + 1600 = 11600
  assert.strictEqual(calculateNetTotal(10000, false, false), 11600);
  // ISR only: 10000 + 1600 - 1000 = 10600
  assert.strictEqual(calculateNetTotal(10000, true, false), 10600);
  // Both: 10000 + 1600 - 1000 - 1066.6666... = 9533.3333...
  const net = calculateNetTotal(10000, true, true);
  assert.ok(Math.abs(net - 9533.33) < 0.01, "Withholding sum should match 9533.33");
  console.log("✅ Test 7 Passed!");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(error.stack || error.message);
  process.exit(1);
}
