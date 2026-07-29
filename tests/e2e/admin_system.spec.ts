import { test, expect } from "@playwright/test";

test.describe("Admin Command Center - System Health E2E", () => {
  test("should load system health and display deployments status when in demo mode", async ({ page }) => {
    // 1. Visit dashboard in demo mode to establish session and initialize localStorage
    await page.goto("/dashboard?demo=true");
    
    // 2. Set demo_mode manually in localStorage since dashboard doesn't set it automatically on mount
    await page.evaluate(() => {
      localStorage.setItem("demo_mode", "true");
    });

    // 3. Visit system tab in demo mode
    await page.goto("/admin?tab=system&demo=true");

    // 4. Verify title header is visible
    await expect(page.locator("h2:has-text('System Health')")).toBeVisible();

    // 5. Verify health subcheck elements are visible (Database, Storage, Auth, Payments, Email)
    await expect(page.locator("text=Database")).toBeVisible();
    await expect(page.locator("text=Storage")).toBeVisible();
    await expect(page.locator("text=Auth")).toBeVisible();
    await expect(page.locator("text=Payments")).toBeVisible();
    await expect(page.locator("text=Email")).toBeVisible();

    // 6. Verify system logs container exists
    await expect(page.locator("h3:has-text('System Logs')")).toBeVisible();

    // 7. Verify deployments container exists
    await expect(page.locator("h3:has-text('Recent Deployments')")).toBeVisible();
  });
});
