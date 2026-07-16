import { test, expect } from "@playwright/test";

test.describe("Landing Page & Navigation Header E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies/localStorage to ensure clean logged-out state
    await page.context().clearCookies();
  });

  test("should show simplified header and helper links when logged out, and toggle on login/demo", async ({ page }) => {
    // 1. Navigate to landing page (logged out)
    await page.goto("/");

    // 2. Verify simplified header visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify "Verificador" is visible, but dashboard links are hidden
    await expect(header.locator('text="Verificador"')).toBeVisible();
    await expect(header.locator('text="Panel"')).not.toBeVisible();
    await expect(header.locator('text="Nuevo Contrato"')).not.toBeVisible();
    await expect(header.locator('text="Expedientes"')).not.toBeVisible();
    await expect(header.locator('text="Notificaciones"')).not.toBeVisible();

    // Verify header CTA is "Iniciar Sesión"
    await expect(header.locator('text="Iniciar Sesión"')).toBeVisible();
    await expect(header.locator('text="Registrarse"')).not.toBeVisible();

    // 3. Verify Hero CTA buttons & helper links
    await expect(page.locator('text="Comenzar a Crear"')).toBeVisible();
    await expect(page.locator('text="Probar Demo con Datos"')).toBeVisible();
    await expect(page.locator('text="¿Ya tienes una cuenta?"')).toBeVisible();
    await expect(page.locator('text="Inicia sesión aquí"')).toBeVisible();

    // 4. Click header "Iniciar Sesión" and verify redirects to /login & header CTA changes to "Registrarse"
    await header.locator('text="Iniciar Sesión"').click();
    await expect(page).toHaveURL(/\/login/);
    await page.waitForLoadState('networkidle');
    await expect(header.locator('text="Registrarse"')).toBeVisible();
    await expect(header.locator('text="Iniciar Sesión"')).not.toBeVisible();

    // 5. Return to landing page and activate demo mode
    await page.goto("/");
    await page.click('text="Probar Demo con Datos"');
    
    // Verify redirects to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify header is now full
    await expect(header.locator('text="Panel"')).toBeVisible();
    await expect(header.locator('text="Nuevo Contrato"')).toBeVisible();
    await expect(header.locator('text="Verificador"')).toBeVisible();
    await expect(header.locator('text="Expedientes"')).toBeVisible();
    await expect(header.locator('text="Notificaciones"')).toBeVisible();
    await expect(header.locator('text="Mi Panel"')).toBeVisible();
    await expect(header.locator('text="Cerrar Sesión"')).toBeVisible();

    // Navigate to landing page (while logged in/in demo mode)
    await page.goto("/");
    
    // Verify Hero CTA buttons show "Ir a mi Panel" instead of "Comenzar a Crear"
    await expect(page.locator('text="Ir a mi Panel"')).toBeVisible();
    await expect(page.locator('text="Comenzar a Crear"')).not.toBeVisible();
    await expect(page.locator('text="Probar Demo con Datos"')).not.toBeVisible();
    await expect(page.locator('text="¿Ya tienes una cuenta? Inicia sesión aquí"')).not.toBeVisible();

    // 6. Logout and verify return to logged out state
    await page.goto("/dashboard");
    await header.locator('text="Cerrar Sesión"').click();
    
    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(header.locator('text="Registrarse"')).toBeVisible();

    // Navigate back to home and verify header is simplified again
    await page.goto("/");
    await expect(header.locator('text="Iniciar Sesión"')).toBeVisible();
    await expect(header.locator('text="Panel"')).not.toBeVisible();
  });
});
