import { test, expect } from "@playwright/test";

test.describe("Sprint WB-3: UX & Document Completeness E2E Suite", () => {
  
  test("should load hash-verifier, notifications, and documents pages successfully", async ({ page }) => {
    // 1. Check Hash Verifier page
    await page.goto("/hash-verifier?demo=true");
    await expect(page.locator("h1")).toContainText("Verificador de Integridad de Contratos");
    
    // Fill text and verify hash calculation
    await page.locator("textarea").fill("Contrato de prueba de servicios profesionales");
    await page.locator("button:has-text('Verificar Sello Digital')").click();
    
    // Sello calculado must appear
    await expect(page.locator("span:has-text('Sello Calculado')")).toBeVisible();

    // 2. Check Notifications page
    await page.goto("/notifications?demo=true");
    await expect(page.locator("h1")).toContainText("Notificaciones");

    // 3. Check Standalone Documents page
    await page.goto("/documents?demo=true");
    await expect(page.locator("h1")).toContainText("Expediente de Documentos");
  });

  test("should manage payment profiles and select one when creating a new contract", async ({ page }) => {
    await page.goto("/dashboard?demo=true");
    
    // Open settings (where profiles are managed)
    await page.goto("/dashboard/settings?demo=true");
    
    // Create a new payment profile
    await page.locator("button:has-text('+ Agregar Cuenta')").click();
    await page.locator("input[placeholder='Ej. Mi Cuenta Principal']").fill("Mi Cuenta de STP");
    await page.locator("input[placeholder='Ej. BBVA, Santander, STP']").fill("STP");
    await page.locator("input[placeholder='18 dígitos']").fill("123456789012345678");
    await page.locator("button:has-text('Guardar Perfil')").click();
    
    // Check if the profile is in the list
    await expect(page.locator("span:has-text('Mi Cuenta de STP')")).toBeVisible();
    
    // Go to New Contract page
    await page.goto("/contracts/new?demo=true");
    
    // Pre-fill client info & Scope
    await page.locator("input[placeholder='Ej. Sofía Garza, S.A. de C.V.']").fill("Cliente Prueba S.A.");
    await page.locator("input[placeholder='sofia@empresa.com']").fill("cliente@prueba.com");
    await page.click('button:has-text("Agregar Datos Fiscales")');
    await page.locator("input[placeholder='Opcional (Ej. GAF1203058X4)']").fill("GASF920412HX8");
    await page.locator("input[placeholder='Opcional (5 dígitos)']").fill("01000");
    await page.locator("textarea[placeholder*='Describe detalladamente los entregables']").fill("Desarrollo de Software a la Medida");
    
    // Go to step 2 (Budget & Milestones)
    await page.click('button:has-text("Siguiente")');
    
    // Go to step 3 (Fiscal/Banking)
    await page.click('button:has-text("Siguiente")');
    
    // Select the Payment Profile in Step 3
    const select = page.locator("select");
    await select.selectOption({ label: "Mi Cuenta de STP (STP - 5678)" });
    
    // Verify that CLABE input got pre-filled
    const clabeInput = page.locator("input[value='123456789012345678']");
    await expect(clabeInput).toBeVisible();
  });

  test.skip("should handle cancellation flow and double-completion logic", async ({ page }) => {
    // Navigate directly to dashboard in demo mode
    await page.goto("/dashboard?demo=true");
    
    // Select an accepted contract (first one typically)
    await page.locator("span:has-text('accepted'), span:has-text('Sellado')").first().click();
    
    // Try to mark completed by freelancer
    const completeBtn = page.locator("button:has-text('Marcar Proyecto como Terminado')");
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
      // Status badge or wait message should appear
      await expect(page.locator("text=Entregado por tu parte. Esperando confirmación")).toBeVisible();
    }
    
    // Check cancellation modal
    const cancelBtn = page.locator("button:has-text('Cancelar Contrato')");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    
    // Fill reason
    await page.locator("textarea[placeholder*='Incumplimiento']").fill("Cancelado por mutuo acuerdo.");
    await page.locator("button:has-text('Confirmar Cancelación')").click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    
    // Contract status must change to cancelled
    await expect(page.locator("span:has-text('cancelled'), span:has-text('Cancelado')").first()).toBeVisible();
  });

});
