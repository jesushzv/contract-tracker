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
    
    await page.click('button:has-text("Guardar Perfil y Empezar")');
    
    // Verify navigated to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display USD conversion details in client payment modal, auto-reconcile, and verify audit logs", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

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
    
    // Select the contract to make sure details drawer is open
    await page.locator('text=Sofía Garza').first().click();

    // Click Copy Link button
    await page.click('button:has-text("Copiar Link Cliente")');
    
    // Grab client URL from clipboard
    const href = await page.evaluate(() => navigator.clipboard.readText());
    expect(href).toContain("/c/");
    
    // Go to client payment view
    await page.goto(href);
    
    // Verify client view loads successfully
    await expect(page.locator("body")).toContainText("Propuesta de Contrato");
    
    // Accept proposal first
    await page.click('button:has-text("Revisar y Firmar Aceptación")');
    await page.fill('input[placeholder="Escribe tu nombre y apellido"]', "Sofía Garza");
    await page.click('button:has-text("Enviar Código de Firma")');
    
    // Fill OTP
    const debugBox = page.locator('div:has-text("Demo Debug Info:")').last();
    await expect(debugBox).toContainText(/es: \d{6}/);
    const debugText = await debugBox.textContent() || "";
    const match = debugText.match(/\b\d{6}\b/);
    const otpCode = match ? match[0] : "";
    console.log("Extracted OTP Code:", otpCode);
    
    await page.fill('input[placeholder="Ej. 123456"]', otpCode);
    await page.click('button:has-text("Verificar y Firmar")');
    
    // Wait for the modal to close and show acceptance success
    await expect(page.locator("body")).toContainText("Contrato firmado exitosamente!");
    
    // Go to freelancer dashboard to countersign/seal the contract
    await page.goto("/dashboard?demo=true");
    await page.locator('text=Sofía Garza').first().click();
    await page.click('button:has-text("Validar y Contra-firmar")');
    
    // Go back to the client page to notify payment
    await page.goto(href);
    await page.click('button:has-text("Ya transferí por SPEI")');
    
    // Verify USD conversion display Banxico exchange rate suggestion
    await expect(page.locator("body")).toContainText("Tipo de Cambio (Banxico sugerido: 20.15)");
    await expect(page.locator("body")).toContainText("Total a Transferir");
    
    // Choose URL receipt method
    await page.click('text=Enlace URL');
    await page.fill('input[placeholder*="dropbox.com"]', "https://ejemplo.com/recibo.pdf");

    // Enter tracking reference and notify payment
    await page.fill('input[placeholder="Ej. 182746182903485761 o folio"]', "SPEI12345");
    await page.click('button:has-text("Notificar Pago")');
    
    // Wait for automatic reconciliation which immediately confirms the payment
    await expect(page.locator("body")).toContainText("confirmado");

    // Finally, verify Export Audit Log is visible in dashboard
    await page.goto("/dashboard?demo=true");
    await page.locator('text=Sofía Garza').first().click();
    const exportBtn = page.locator('button:has-text("Exportar Audit Log")');
    await expect(exportBtn).toBeVisible();
  });
});
