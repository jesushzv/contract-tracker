import { test, expect } from "@playwright/test";

test.describe("Sprint WA: Security & Taxes E2E Integration Suite", () => {
  
  test("should validate RFC input on onboarding page", async ({ page }) => {
    // Navigate to onboarding in demo mode
    await page.goto("/onboarding?demo=true");
    
    // Step 1: Fill name and go to step 2
    await page.fill('input[placeholder="Ej. Héctor Guerrero"]', "Héctor Guerrero");
    await page.click("button:has-text('Siguiente Step')");
    
    const rfcInput = page.locator('input[placeholder="Ej. GUEH860710MX3"]');
    await expect(rfcInput).toBeVisible();
    
    // Enter an invalid RFC format (too short)
    await rfcInput.fill("ABC12");
    await rfcInput.blur();
    await expect(page.locator("body")).toContainText("El RFC debe tener exactamente 12 o 13 caracteres.");
    
    // Enter an invalid check digit RFC
    await rfcInput.fill("GUEH860710MX3");
    await rfcInput.blur();
    await expect(page.locator("body")).toContainText("Dígito verificador inválido.");
    
    // Enter a valid check digit RFC
    await rfcInput.fill("GUEH860710MX8");
    await rfcInput.blur();
    await expect(page.locator("body")).not.toContainText("El RFC debe tener exactamente");
    await expect(page.locator("body")).not.toContainText("Dígito verificador inválido");
  });

  test("should calculate Mexican tax withholdings dynamically on contract creation", async ({ page }) => {
    // Navigate to new contract page
    await page.goto("/contracts/new?demo=true");
    
    // Step 1: Fill client info and scope
    await page.fill('input[placeholder="Ej. Sofía Garza, S.A. de C.V."]', "Mi Cliente");
    await page.fill('input[placeholder="sofia@empresa.com"]', "cliente@gmail.com");
    await page.fill('input[placeholder="Opcional (Ej. GAF1203058X4)"]', "GASF920412HX8");
    await page.fill('textarea[placeholder*="Describe detalladamente los entregables"]', "Diseño web completo para el portal corporativo.");
    
    // Click Next button
    await page.click('button:has-text("Siguiente")');
    
    // Step 2: Fill budget and check withholdings
    await page.fill('input[name="totalAmount"]', "10000");
    
    // Verify default breakdown (Subtotal: 10,000, IVA: 1,600, Net: 11,600)
    await expect(page.locator("body")).toContainText("Subtotal");
    await expect(page.locator("body")).toContainText("$11,600.00");
    
    // Toggle Retención ISR (10%)
    await page.click('label:has-text("Retener ISR (10%)")');
    // Verify ISR breakdown (-$1,000.00 and Net: 10,600)
    await expect(page.locator("body")).toContainText("-$1,000.00");
    await expect(page.locator("body")).toContainText("$10,600.00");
    
    // Toggle Retención IVA (10.667% / 2/3 partes)
    await page.click('label:has-text("Retener IVA (10.667% / 2/3 partes)")');
    // Verify both withholdings (-$1,066.67 and Net: 9,533.33)
    await expect(page.locator("body")).toContainText("-$1,066.67");
    await expect(page.locator("body")).toContainText("$9,533.33");
  });
});
