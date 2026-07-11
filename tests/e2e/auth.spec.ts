import { test, expect } from "@playwright/test";

test.describe("Authentication & Session Redirection E2E Suite", () => {
  
  test("should redirect from /dashboard to /login when unauthenticated", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    
    // Expect URL to redirect to /login
    await expect(page).toHaveURL(/\/login/);
    
    // Expect login page components to be present
    const heading = page.locator("h1");
    await expect(heading).toHaveText("Iniciar Sesión");
  });

  test("should bypass login redirect and load dashboard in ?demo=true mode", async ({ page }) => {
    // Navigate to dashboard with demo query param
    await page.goto("/dashboard?demo=true");
    
    // Expect URL to remain on /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Expect default profile name to render in settings or main views
    const heading = page.locator("h1");
    await expect(heading).toContainText("Panel de Control");
    await expect(page.locator("body")).toContainText("Guerrero");
  });

  test("should render Login, Register forms and allow link transitions", async ({ page }) => {
    // Navigate to login
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("Iniciar Sesión");
    
    // Click register link
    await page.click('text="Regístrate aquí"');
    
    // Expect register page to load
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("h1")).toHaveText("Crear Cuenta");
    
    // Click back link
    await page.click('text="Inicia sesión aquí"');
    await expect(page).toHaveURL(/\/login/);
  });
});
