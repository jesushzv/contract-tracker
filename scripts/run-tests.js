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

  // Test 8: XSS sanitization (Sprint SEC)
  console.log("🧪 Running Test 8: XSS Input Sanitization...");
  function sanitizeInput(val) {
    if (typeof val !== "string") return val;
    return val.replace(/<[^>]*>/g, "");
  }
  assert.strictEqual(sanitizeInput("<script>alert('XSS')</script>Hello"), "alert('XSS')Hello");
  assert.strictEqual(sanitizeInput("<b>Important</b>"), "Important");
  assert.strictEqual(sanitizeInput("Normal text"), "Normal text");
  console.log("✅ Test 8 Passed!");

  // Test 9: Rate Limiting (Sprint SEC)
  console.log("🧪 Running Test 9: Rate Limiting logic...");
  const rateLimitDb = {};
  function checkRateLimit(ip, action, limit, windowMs) {
    const key = `${ip}:${action}`;
    const now = Date.now();
    if (!rateLimitDb[key]) {
      rateLimitDb[key] = [];
    }
    // Clean old records
    rateLimitDb[key] = rateLimitDb[key].filter(timestamp => now - timestamp < windowMs);
    if (rateLimitDb[key].length >= limit) {
      return true; // Limited
    }
    rateLimitDb[key].push(now);
    return false; // Allowed
  }
  const testIp = "192.168.1.1";
  const action = "test_action";
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 1
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 2
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 3
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), true);  // 4 (limited!)
  console.log("✅ Test 9 Passed!");

  // Test 10: File Verification (Magic Bytes and Size) (Sprint SEC)
  console.log("🧪 Running Test 10: File Magic Bytes & Size Validation...");
  function validateReceiptFile(fileName, mimeType, fileBase64) {
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("El archivo excede el límite de tamaño de 5MB.");
    }
    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Tipo de archivo no permitido. Solo se permiten PDFs e imágenes (PNG, JPEG).");
    }
    
    // Magic bytes verification
    const hex = buffer.toString("hex", 0, 8).toUpperCase();
    let isValidMagic = false;
    if (mimeType === "application/pdf" && hex.startsWith("25504446")) isValidMagic = true;
    else if (mimeType === "image/png" && hex.startsWith("89504E470D0A1A0A")) isValidMagic = true;
    else if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && hex.startsWith("FFD8FF")) isValidMagic = true;

    if (!isValidMagic) {
      throw new Error("Firma de archivo inválida. El contenido del archivo no coincide con su extensión.");
    }
    return true;
  }

  // Valid PDF: %PDF- (25504446...)
  const pdfBase64 = Buffer.from("%PDF-1.4\n1 0 obj\n...").toString("base64");
  assert.strictEqual(validateReceiptFile("recibo.pdf", "application/pdf", pdfBase64), true);

  // Invalid PDF content (fake extension)
  const fakePdfBase64 = Buffer.from("NOTA_PDF_REAL").toString("base64");
  assert.throws(() => {
    validateReceiptFile("cheat.pdf", "application/pdf", fakePdfBase64);
  }, /Firma de archivo inválida/);

  // Too large file (>5MB)
  const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const largeBase64 = largeBuffer.toString("base64");
  assert.throws(() => {
    validateReceiptFile("big.pdf", "application/pdf", largeBase64);
  }, /El archivo excede el límite/);

  console.log("✅ Test 10 Passed!");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ TEST SUITE FAILED:");
  console.error(error.stack || error.message);
  process.exit(1);
}
