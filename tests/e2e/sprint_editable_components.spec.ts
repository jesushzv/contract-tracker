import { test, expect } from "@playwright/test";

test.describe("Sprint E2E: Contract Components Custom Editing Suite", () => {

  test("should allow freelancer to modify contract details and client to propose revision with edits", async ({ page }) => {
    // Register dialog handler to auto-accept browser alerts
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    // 1. Go to Freelancer Dashboard in demo mode
    await page.goto("/dashboard?demo=true");

    // 2. Select the contract "Mariana Rosas (Studio Flora)" which is in status 'sent'
    await page.locator("span:has-text('Mariana Rosas')").first().click();

    // Verify contract detail loads
    await expect(page.locator("h2")).toContainText("Mariana Rosas");

    // 3. Click 'Modificar Propuesta' to open the Freelancer edit modal
    const modifyPropBtn = page.locator("button:has-text('Modificar Propuesta')");
    await expect(modifyPropBtn).toBeVisible();
    await modifyPropBtn.click();

    // 4. Edit client name in the modal
    const clientNameInput = page.locator("label:has-text('Nombre / Razón Social') + input").first();
    await expect(clientNameInput).toBeVisible();
    await clientNameInput.fill("Mariana Rosas (Studio Flora E2E)");

    // 5. Select Retención ISR checkbox
    const isrCheckbox = page.locator("label:has-text('Retención ISR') input[type='checkbox']");
    await isrCheckbox.check();

    // 6. Submit the Freelancer edits
    const confirmBtn = page.locator("button:has-text('Confirmar y Solicitar Firma')");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Confirm the warning/confirmation modal
    const warningConfirmBtnFreelancer = page.getByRole('button', { name: 'Confirmar', exact: true });
    await expect(warningConfirmBtnFreelancer).toBeVisible();
    await warningConfirmBtnFreelancer.click();

    // Wait for the modal to close and dashboard details to update
    await expect(page.locator("h2")).toContainText("Mariana Rosas (Studio Flora E2E)");

    // 7. Now navigate to the Client portal view for this contract with token parameter
    await page.goto("/c/c2-landing-page?token=token-c2-landing-page&demo=true");

    // Verify client page displays modified name
    await expect(page.locator("text=Mariana Rosas (Studio Flora E2E)").first()).toBeVisible();

    // 8. Open client revision request modal
    const solicitRevBtn = page.locator("button:has-text('Solicitar Revisión')");
    await expect(solicitRevBtn).toBeVisible();
    await solicitRevBtn.click();

    // 9. Edit Client RFC, Budget, and add a comment
    const clientRfcInput = page.locator("label:has-text('Tu RFC') + input");
    await expect(clientRfcInput).toBeVisible();
    await clientRfcInput.fill("ROSM880912ABC");

    // Modify budget to 19000
    const budgetInput = page.locator("label:has-text('Presupuesto Total') + div input");
    await expect(budgetInput).toBeVisible();
    await budgetInput.fill("19000");

    // Fill revision reason
    const reasonTextarea = page.locator("textarea[placeholder*='Favor de corregir']");
    await expect(reasonTextarea).toBeVisible();
    await reasonTextarea.fill("Ajustar presupuesto a 19000 MXN y corregir mi RFC.");

    // 10. Submit revision request with components edit
    const clientSubmitBtn = page.locator("button:has-text('Proponer Cambios y Solicitar Revisión')");
    await expect(clientSubmitBtn).toBeVisible();
    await clientSubmitBtn.click();

    // 11. Confirm warning/confirmation modal
    const warningConfirmBtnClient = page.getByRole('button', { name: 'Confirmar', exact: true });
    await expect(warningConfirmBtnClient).toBeVisible();
    await warningConfirmBtnClient.click();

    // 12. Page should reload or update status to draft (Borrador)
    await expect(page.locator("span:has-text('Borrador'), span:has-text('draft')").first()).toBeVisible();
    
    // Check that new budget 19,000.00 MXN is updated
    await expect(page.locator("text=$19,000.00")).toBeVisible();
  });

});
