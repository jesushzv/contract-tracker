import { test, expect } from "@playwright/test";

test.describe("Sprint QA-1: Freelancer Payment Proof & State Transition Warnings E2E Suite", () => {
  test.describe.configure({ mode: "serial" });

  test("should complete onboarding and verify dashboard confirmations/payment proof flow", async ({ page, context }) => {
    // Enable logging
    page.on("console", msg => console.log(`[BROWSER CONSOLE]: ${msg.text()}`));
    page.on("pageerror", err => console.error(`[BROWSER ERROR]: ${err.message}`));

    // 1. Complete onboarding
    await page.goto("/onboarding?demo=true");
    await page.click('text=Plan Starter');
    await page.fill('input[placeholder="Ej. Héctor Guerrero"]', "Héctor Guerrero");
    await page.fill('input[placeholder="Ej. +525512345678"]', "+525598765432");
    
    // Go to Step 2
    await page.click("button:has-text('Siguiente Step')");
    
    const rfcInput = page.locator('input[placeholder="Ej. GUEH860710MX3"]');
    await rfcInput.fill("GUEH860710MX8");
    await rfcInput.blur();
    await page.selectOption('select', '626 - Régimen Simplificado de Confianza (RESICO)');
    
    // Go to Step 3
    await page.click("button:has-text('Siguiente Step')");
    
    await page.fill('input[placeholder="Ej. BBVA México o STP"]', "BBVA México");
    await page.fill('input[placeholder="18 dígitos para SPEI"]', "123456789012345678");
    
    await page.click('button:has-text("Guardar Perfil y Empezar")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // 3. Create a new contract
    await page.goto("/contracts/new?demo=true");
    await page.fill('input[placeholder="Ej. Sofía Garza, S.A. de C.V."]', "Sofía Garza");
    await page.fill('input[placeholder="sofia@empresa.com"]', "sofia@gmail.com");
    await page.fill('input[placeholder="Ej. +525512345678"]', "+525511223344");
    await page.fill('textarea[placeholder*="Describe detalladamente los entregables"]', "Desarrollo de Software");
    await page.click('button:has-text("Siguiente Paso")');
    // Set currency to USD
    await page.selectOption('select', 'USD');
    await page.click('button:has-text("Siguiente Paso")');
    await page.click('button:has-text("Crear y Activar Contrato")');
    await expect(page).toHaveURL(/\/dashboard/);

    // Select the contract
    await page.locator('text=Sofía Garza').first().click();

    // Copy client link
    await page.click('button:has-text("Copiar Link")');
    const clientUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(clientUrl).toContain("/c/");

    // 4. Navigate to client view and sign the contract with confirmation guard
    await page.goto(clientUrl);
    await expect(page.locator("body")).toContainText("Propuesta de Contrato");
    await page.click('button:has-text("Revisar y Firmar Aceptación")');
    await page.fill('input[placeholder="Escribe tu nombre y apellido"]', "Sofía Garza");
    await page.click('button:has-text("Continuar")');

    // Extract OTP Code
    const debugBox = page.locator('div:has-text("SYSTEM_DEBUG_OTP")').last();
    await debugBox.waitFor({ timeout: 10000 });
    await expect(debugBox).toContainText(/\d{6}/, { timeout: 10000 });
    const debugText = await debugBox.textContent() || "";
    const match = debugText.match(/\b\d{6}\b/);
    const otpCode = match ? match[0] : "";

    await page.fill('input[placeholder="••••••"]', otpCode);
    await page.click('button:has-text("Verificar y Firmar")');

    // Check Accept Confirmation Modal
    await expect(page.locator("h3:has-text('Firmar Contrato')")).toBeVisible();
    await expect(page.locator("text=¿Estás seguro de que deseas firmar digitalmente")).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();

    // Verification of accept success
    await expect(page.locator("body")).toContainText("Contrato firmado exitosamente!");

    // 5. Freelancer dashboard: Seal contract with confirmation guard
    await page.goto("/dashboard?demo=true");
    await page.locator('text=Sofía Garza').first().click();
    await page.click('button:has-text("Validar y Contra-firmar")');

    // Seal Confirmation Modal
    await expect(page.locator("h3:has-text('Contra-firmar y Sellar Contrato')")).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    
    // Status should be accepted/Sellado
    await expect(page.locator("span:has-text('accepted'), span:has-text('Sellado')").first()).toBeVisible();

    // 6. Milestone request & freelancer payment proof modal
    // Click 'Solicitar Cobro'
    await page.click('button:has-text("Solicitar Cobro")');
    
    // Click 'Marcar como Pagado'
    await page.click('button:has-text("Firmar Contrato")');

    // Check Freelancer Payment Modal
    await expect(page.locator("h3:has-text('Notificar Transferencia SPEI')")).toBeVisible();
    
    // Enter tracking reference and receipt URL
    await page.fill('input[placeholder="Ej. 182746182903485761 o folio"]', "SPEI-FL-54321");
    await page.click('text=Enlace URL');
    await page.fill('input[placeholder*="dropbox.com"]', "https://my-cloud-receipt.com/doc.pdf");
    await page.click('button:has-text("Registrar Pago")');

    // Status should update to confirmed (due to auto-reconciliation)
    await expect(page.locator("text=Cobro Listo").first()).toBeVisible();

    // 7. Revert milestone status with confirmation warning
    const revertBtn = page.locator('button[title="Revertir a Reportado"]').first();
    await expect(revertBtn).toBeVisible();
    await revertBtn.click();

    // Check Revert Confirmation Warning Modal
    await expect(page.locator("h3:has-text('Revertir Estado de Hito')")).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();

    // Milestone status should revert back to marked_paid/Reportado
    await expect(page.locator("span:has-text('marked_paid'), span:has-text('Reportado')").first()).toBeVisible();

    // 8. Cancel Contract with confirmation guard
    const cancelBtn = page.locator("button:has-text('Cancelar Contrato')");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Fill cancel reason
    await page.locator("textarea[placeholder*='Incumplimiento']").fill("Cancelación de prueba");
    await page.locator("button:has-text('Confirmar Cancelación')").click();

    // Cancel Confirmation Warning Modal
    await expect(page.locator("text=¿Estás seguro de que deseas cancelar")).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();

    // Contract status must change to cancelled/Cancelado
    await expect(page.locator("span:has-text('cancelled'), span:has-text('Cancelado')").first()).toBeVisible();
  });
});
