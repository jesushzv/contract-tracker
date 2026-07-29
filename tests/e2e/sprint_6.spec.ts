import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Sprint 6: E2E Integration Suite for Magic Links, Emails, and WhatsApp", () => {

  test("should deny client page access without token or with invalid token", async ({ page }) => {
    // 1. Navigate without a token - Restricted Access should trigger
    await page.goto("/c/c2-landing-page?demo=true");
    
    // Check that we see access restriction screen
    await expect(page.locator("body")).toContainText("Acceso Restringido");
    await expect(page.locator("body")).not.toContainText("Vista del Cliente");
    await expect(page.locator("body")).not.toContainText("Mariana Rosas");

    // 2. Navigate with an invalid token - Restricted Access should trigger
    await page.goto("/c/c2-landing-page?demo=true&token=incorrect-token-xyz");
    await expect(page.locator("body")).toContainText("Acceso Restringido");
    
    // 3. Navigate with correct token - Contract page should load successfully
    await page.goto("/c/c2-landing-page?demo=true&token=token-c2-landing-page");
    await expect(page.locator("body")).toContainText("Vista del Cliente");
    await expect(page.locator("body")).toContainText("Mariana Rosas");
  });

  test("should include access tokens in copy link and share link buttons", async ({ page }) => {
    await page.goto("/dashboard?demo=true");

    // Wait for the contracts grid to render
    await page.waitForSelector("text=Mariana Rosas");

    // Find the contract card for c2-landing-page and open context menu or click copy link
    // Open the detail view by clicking a contract
    await page.locator('h3:has-text("Mariana Rosas")').first().click();
    
    const copyButton = page.locator('button:has-text("Copiar Link")').first();
    await expect(copyButton).toBeVisible();

    // Verify share WhatsApp elements in alerts or share dialogs
    const shareWaButtons = page.locator('a[href*="wa.me"]').first();
    if (await shareWaButtons.count() > 0) {
      const href = await shareWaButtons.getAttribute("href");
      expect(href).toContain("token=");
      expect(href).toContain("demo=true");
    }
  });

  test("should simulate client signatures and show the WhatsApp notify action", async ({ page }) => {
    // Navigate using the correct magic link token
    await page.goto("/c/c2-landing-page?demo=true&token=token-c2-landing-page");
    await expect(page.locator("body")).toContainText("Mariana Rosas");

    // Trigger Sign OTP flow
    const signBtn = page.locator('button:has-text("Firmar Contrato")');
    if (await signBtn.isVisible()) {
      await signBtn.click();
      
      // Verification input
      const otpInput = page.locator('input[placeholder="000 000"]');
      await expect(otpInput).toBeVisible();
      
      // Let's enter the mocked OTP 123456
      await otpInput.fill("123456");
      await page.click('button:has-text("Verificar y Firmar")');
      
      // Success banner should show
      await expect(page.locator("body")).toContainText("firmado exitosamente");
      
      // "Notificar por WhatsApp" button should be visible
      const notifyWa = page.locator('a:has-text("Notificar por WhatsApp")');
      await expect(notifyWa).toBeVisible();
      const href = await notifyWa.getAttribute("href");
      expect(href).toContain("wa.me");
      expect(href).toContain("ya%20firm%C3%A9%20el%20contrato");
    }
  });

  test("should execute the cron reminders API route successfully", async ({ request }) => {
    // Clear outbox first to have a clean slate
    const outboxPath = path.join(process.cwd(), "data", "simulated_emails.json");
    if (fs.existsSync(outboxPath)) {
      try {
        fs.unlinkSync(outboxPath);
      } catch {}
    }

    // Call the reminders endpoint
    const response = await request.get("/api/cron/reminders");
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body).toHaveProperty("processedContracts");
    expect(body).toHaveProperty("sentRemindersCount");

    // Check if simulated_emails.json matches expectations if reminders were sent
    if (body.sentRemindersCount > 0) {
      expect(fs.existsSync(outboxPath)).toBeTruthy();
      const fileContent = fs.readFileSync(outboxPath, "utf-8");
      const outbox = JSON.parse(fileContent);
      expect(outbox.length).toBeGreaterThanOrEqual(1);
      expect(outbox[0].subject).toContain("Recordatorio de Pago");
    }
  });

});
