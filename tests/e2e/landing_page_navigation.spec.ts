import { test, expect } from "@playwright/test";

test.describe("Landing Page & Navigation Header E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies/localStorage to ensure clean logged-out state
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show simplified header and helper links when logged out, and toggle on login/demo", async ({ page }) => {
    // 1. Navigate to landing page (logged out)
    await page.goto("/");

    // 2. Verify simplified header visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify header CTA is "Iniciar Sesión"
    await expect(header.locator('text="Iniciar Sesión"')).toBeVisible();
    await expect(header.locator('text="Registrarse"')).not.toBeVisible();

    // Verify dashboard links are hidden
    await expect(page.locator('text="Pipeline"')).not.toBeVisible();
    await expect(page.locator('text="Nuevo Contrato"')).not.toBeVisible();
    await expect(page.locator('text="Documentos"')).not.toBeVisible();

    // 3. Verify Hero CTA buttons & helper links
    await expect(page.locator('a:has-text("Comenzar Gratis")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Probar Demo")').first()).toBeVisible();
    await expect(page.locator('text=/Sin tarjeta de crédito/')).toBeVisible();

    // 4. Click header "Iniciar Sesión" and verify redirects to /login & header CTA changes to "Registrarse"
    await header.locator('text="Iniciar Sesión"').click();
    await page.waitForURL(/\/login/);
    await page.waitForLoadState('networkidle');
    const updatedHeader = page.locator("header");
    await expect(updatedHeader.locator('text="Registrarse"')).toBeVisible({ timeout: 10000 });
    await expect(updatedHeader.locator('text="Iniciar Sesión"')).not.toBeVisible();

    // 5. Return to landing page and activate demo mode
    await page.goto("/");
    await page.locator('a:has-text("Probar Demo")').first().click();
    
    // Verify redirects to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify sidebar links are visible (using .first() because mobile and desktop might have duplicate entries)
    await expect(page.locator('text="Pipeline"').first()).toBeVisible();
    await expect(page.locator('text="Nuevo Contrato"').first()).toBeVisible();
    await expect(page.locator('text="Verificador"').first()).toBeVisible();
    await expect(page.locator('text="Documentos"').first()).toBeVisible();
    await expect(page.locator('text="Cerrar Sesión"').first()).toBeVisible();

    // Navigate to landing page (while logged in/in demo mode)
    await page.goto("/");
    
    // Verify Hero CTA buttons show "Ir a mi Panel" instead of "Comenzar a Crear"
    await expect(page.locator('text="Ir a mi Panel"')).toBeVisible();
    await expect(page.locator('text="Comenzar a Crear"')).not.toBeVisible();
    await expect(page.locator('text="Probar Demo con Datos"')).not.toBeVisible();
    await expect(page.locator('text="¿Ya tienes una cuenta? Inicia sesión aquí"')).not.toBeVisible();

    // 6. Logout and verify return to logged out state
    await page.goto("/dashboard");
    await page.locator('text="Cerrar Sesión"').first().click();
    
    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(header.locator('text="Registrarse"')).toBeVisible();

    // Navigate back to home and verify header is simplified again
    await page.goto("/");
    await expect(header.locator('text="Iniciar Sesión"')).toBeVisible();
    await expect(page.locator('text="Pipeline"')).not.toBeVisible();
  });
});
