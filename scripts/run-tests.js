const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// Import compiled TS files
const { validateRFC } = require('./compiled/rfcValidator');

// Mock milestone validator function (matching new contract page check)
function isBalanceValid(milestones, totalAmount) {
  const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
  return sum === totalAmount;
}

// Proportional milestone scaling (Sprint 4)
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

// Tenant scoping fallback (Sprint 5)
function resolveTargetUserId(authCookieVal) {
  if (authCookieVal) {
    try {
      const parsed = JSON.parse(authCookieVal);
      if (parsed?.user?.id) return parsed.user.id;
    } catch {}
  }
  return "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9"; // default fallback
}

// Mexican Withholding Tax Calculations
function calculateNetTotal(amount, retIsr, retIva) {
  const subtotal = amount;
  const iva = amount * 0.16;
  const isr = retIsr ? amount * 0.10 : 0;
  const retIvaAmt = retIva ? amount * 0.16 * (2 / 3) : 0;
  return subtotal + iva - isr - retIvaAmt;
}

// XSS sanitization (Sprint SEC)
function sanitizeInput(val) {
  if (typeof val !== "string") return val;
  return val.replace(/<[^>]*>/g, "");
}

// Rate Limiting (Sprint SEC)
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

// File Verification (Magic Bytes and Size) (Sprint SEC)
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

test('Test 1: Exact Balance Validation', () => {
  const validMilestones = [
    { label: "Anticipo", amount: 15000 },
    { label: "Finiquito", amount: 15000 }
  ];
  assert.strictEqual(isBalanceValid(validMilestones, 30000), true);
});

test('Test 2: Mismatched Balance Validation', () => {
  const invalidMilestones = [
    { label: "Anticipo", amount: 15000 },
    { label: "Finiquito", amount: 10000 }
  ];
  assert.strictEqual(isBalanceValid(invalidMilestones, 30000), false);
});

test('Test 3: Integrity Hash Generation Mock', () => {
  const payload = { id: "c-123", amount: 30000 };
  const hash1 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const hash2 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  assert.strictEqual(hash1, hash2);
});

test('Test 4: Proportional Milestone Scaling', () => {
  const milestones = [{ amount: 15000 }, { amount: 15000 }];
  const scaled = scaleMilestones(milestones, 30000, 45000);
  assert.strictEqual(scaled[0].amount, 22500);
  assert.strictEqual(scaled[1].amount, 22500);
  assert.strictEqual(scaled.reduce((acc, m) => acc + m.amount, 0), 45000);
});

test('Test 5: Tenant Scoping Fallback', () => {
  assert.strictEqual(resolveTargetUserId(null), "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9");
  assert.strictEqual(resolveTargetUserId('{"user":{"id":"test-user-uuid"}}'), "test-user-uuid");
});

test('Test 6: RFC Taxpayer Verification', () => {
  // Valid Physical RFC
  assert.strictEqual(validateRFC("GUEH860710MX8").isValid, true);
  assert.strictEqual(validateRFC("GUEH860710MX8").type, "Fisica");

  // Valid Moral RFC
  assert.strictEqual(validateRFC("FMX1802058T7").isValid, true);
  assert.strictEqual(validateRFC("FMX1802058T7").type, "Moral");

  // Empty and spacing checks
  assert.strictEqual(validateRFC("").isValid, false);
  assert.strictEqual(validateRFC("  GUEH860710MX8  ").isValid, true);

  // Length checks
  assert.strictEqual(validateRFC("GUEH860710M").isValid, false);
  assert.strictEqual(validateRFC("GUEH860710MXXXX").isValid, false);

  // Regex format mismatch checks
  assert.strictEqual(validateRFC("GU1H860710MX8").isValid, false); // physical invalid letters
  assert.strictEqual(validateRFC("FM11802058T3").isValid, false);  // moral invalid letters

  // Date validation checks
  assert.strictEqual(validateRFC("GUEH861310MX8").isValid, false); // Month 13
  assert.strictEqual(validateRFC("GUEH860732MX8").isValid, false); // Day 32

  // Check digit verification failure
  const res = validateRFC("GUEH860710MX9");
  assert.strictEqual(res.isValid, false);
  assert.ok(res.error.includes("Dígito verificador inválido"));
});

test('Test 7: Mexican Withholding Tax Calculations', () => {
  assert.strictEqual(calculateNetTotal(10000, false, false), 11600);
  assert.strictEqual(calculateNetTotal(10000, true, false), 10600);
  const net = calculateNetTotal(10000, true, true);
  assert.ok(Math.abs(net - 9533.33) < 0.01);
});

test('Test 8: XSS Input Sanitization', () => {
  assert.strictEqual(sanitizeInput("<script>alert('XSS')</script>Hello"), "alert('XSS')Hello");
  assert.strictEqual(sanitizeInput("<b>Important</b>"), "Important");
  assert.strictEqual(sanitizeInput("Normal text"), "Normal text");
});

test('Test 9: Rate Limiting logic', () => {
  const testIp = "192.168.1.1";
  const action = "test_action";
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 1
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 2
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), false); // 3
  assert.strictEqual(checkRateLimit(testIp, action, 3, 1000), true);  // 4
});

test('Test 10: File Magic Bytes & Size Validation', () => {
  const pdfBase64 = Buffer.from("%PDF-1.4\n1 0 obj\n...").toString("base64");
  assert.strictEqual(validateReceiptFile("recibo.pdf", "application/pdf", pdfBase64), true);

  const fakePdfBase64 = Buffer.from("NOTA_PDF_REAL").toString("base64");
  assert.throws(() => {
    validateReceiptFile("cheat.pdf", "application/pdf", fakePdfBase64);
  }, /Firma de archivo inválida/);

  const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const largeBase64 = largeBuffer.toString("base64");
  assert.throws(() => {
    validateReceiptFile("big.pdf", "application/pdf", largeBase64);
  }, /El archivo excede el límite/);
});
