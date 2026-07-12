import { test, expect } from "@playwright/test";

test.describe("Sprint WB2: SPEI CEP Reconciler, USD FX, Version History & WhatsApp E2E Suite", () => {
  // Use serial mode since the dashboard state depends on onboarding and contract creation
  test.describe.configure({ mode: "serial" });

  test("should complete onboarding with phone and starter plan", async ({ page }) => {
    await page.goto("/onboarding?demo=true");
    
    // Choose Starter plan
    await page.click('text=Plan Starter');
    
    // Fill full name and phone number
    await page.fill('input[placeholder="Ej. Héctor Guerrero"]', "Héctor Guerrero");
    await page.fill('input[placeholder="Ej. +525512345678"]', "+525598765432");
    
    // Fill CLABE and Bank Name
    await page.fill('input[placeholder="Ej. BBVA México o STP"]', "BBVA México");
    await page.fill('input[placeholder="18 dígitos para SPEI"]', "123456789012345678");
    
    // Submit Onboarding
    // First fill RFC to avoid validation errors
    const rfcInput = page.locator('input[placeholder="Ej. GUEH860710MX3"]');
    await rfcInput.fill("GUEH860710MX8");
    await rfcInput.blur();
    
    await page.click('button:has-text("Completar Registro")');
    
    // Verify navigated to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display USD conversion details in client payment modal and auto-reconcile", async ({ page }) => {
    // Navigate directly to new contract creation
    await page.goto("/contracts/new?demo=true");
    
    // Fill Step 1 client details
    await page.fill('input[placeholder="Ej. Sofía Garza, S.A. de C.V."]', "Sofía Garza");
    await page.fill('input[placeholder="sofia@empresa.com"]', "sofia@gmail.com");
    await page.fill('input[placeholder="Ej. +525512345678"]', "+525511223344");
    await page.fill('textarea[placeholder*="Describe detalladamente los entregables"]', "Desarrollo de Software");
    
    // Go to Step 2
    await page.click('button:has-text("Siguiente Paso")');
    
    // Set currency to USD
    await page.selectOption('select', 'USD');
    
    // Go to Step 3
    await page.click('button:has-text("Siguiente Paso")');
    
    // Submit proposal
    await page.click('button:has-text("Crear y Activar Contrato")');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Get the newly created contract ID from list / URL
    const contractLink = page.locator('a:has-text("Copiar Enlace de Pago")');
    await expect(contractLink.first()).toBeVisible();
    
    // Grab client URL: in demo mode it links to /c/[id]?demo=true
    const href = await contractLink.first().getAttribute("href") || "";
    expect(href).toContain("/c/");
    
    // Go to client payment view
    await page.goto(href);
    
    // Verify client view loads successfully
    await expect(page.locator("body")).toContainText("Propuesta de Servicios");
    
    // Accept proposal first
    await page.click('button:has-text("Aceptar Propuesta")');
    await page.fill('input[placeholder="Escribe tu nombre y apellido"]', "Sofía Garza");
    await page.click('button:has-text("Continuar")');
    
    // Fill OTP
    await expect(page.locator('text=Demo Debug Info:')).toBeVisible();
    const debugText = await page.locator('text=Demo Debug Info:').textContent() || "";
    const otpCode = debugText.replace(/[^0-9]/g, "");
    
    await page.fill('input[placeholder="000000"]', otpCode);
    await page.click('button:has-text("Firmar Contrato")');
    
    // Wait for the modal to close and show acceptance success
    await expect(page.locator("body")).toContainText("Acuerdo Firmado Exitosamente");
    
    // Now notify payment for the requested milestone (Anticipo)
    await page.click('button:has-text("Notificar Transferencia SPEI")');
    
    // Verify USD conversion display Banxico exchange rate suggestion
    await expect(page.locator("body")).toContainText("Tipo de Cambio (Banxico sugerido: 20.15)");
    await expect(page.locator("body")).toContainText("Total a Transferir");
    
    // Enter tracking reference and notify payment
    await page.fill('input[placeholder="Ej. 182746182903485761 o folio"]', "SPEI12345");
    await page.click('button:has-text("Notificar Pago")');
    
    // Wait for automatic reconciliation which immediately confirms the payment (since it does not include REJECT)
    await expect(page.locator("body")).toContainText("confirmado");
  });

  test("should display version proposed panel and printable audit trail logs", async ({ page }) => {
    await page.goto("/dashboard?demo=true");
    
    // Select the first contract
    await page.locator('div.glass.rounded-2xl.p-4').first().click();
    
    // Verify Export Audit Log is visible
    const exportBtn = page.locator('button:has-text("Exportar Audit Log")');
    await expect(exportBtn).toBeVisible();
  });
});
