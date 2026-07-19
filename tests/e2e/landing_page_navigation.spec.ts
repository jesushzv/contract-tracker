import { test, expect } from "@playwright/test";

test.describe("Landing Page & Navigation Header E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    // Clear cookies/localStorage to ensure clean logged-out state
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("should show simplified header and helper links when logged out, and toggle on login/demo", async ({ page }) => {
    // 1. Navigate to landing page (logged out)
    // already navigated in beforeEach

    // 2. Verify simplified header visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify header CTA is "Iniciar Sesión"
    await expect(header.getByRole('link', { name: /Iniciar Sesión/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /Registrarse/i })).not.toBeVisible();

    // Verify dashboard links are hidden
    await expect(page.getByRole('link', { name: /Pipeline/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Nuevo Contrato/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Documentos/i })).not.toBeVisible();

    // 3. Verify Hero CTA buttons & helper links
    await expect(page.locator('a:has-text("Comenzar Gratis")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Probar Demo")').first()).toBeVisible();
    await expect(page.locator('text=/Sin tarjeta de crédito/')).toBeVisible();

    // 4. Click header "Iniciar Sesión" and verify redirects to /login & header CTA changes to "Registrarse"
    await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
    await page.waitForURL(/\/login/);
    await page.waitForLoadState('networkidle');
    const updatedHeader = page.locator("header");
    await expect(updatedHeader.getByRole('link', { name: /Registrarse/i })).toBeVisible({ timeout: 10000 });
    await expect(updatedHeader.getByRole('link', { name: /Iniciar Sesión/i })).not.toBeVisible();

    // 5. Return to landing page and activate demo mode
    await page.goto("/");
    await page.getByRole('link', { name: /Probar Demo/i }).first().click();
    
    // Verify redirects to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify sidebar links are visible (using .first() because mobile and desktop might have duplicate entries)
    await expect(page.getByRole('link', { name: /Pipeline/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Nuevo Contrato/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Verificador/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Documentos/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Cerrar Sesión/i }).first()).toBeVisible();

    // Navigate to landing page (while logged in/in demo mode)
    await page.goto("/");
    
    // Verify Hero CTA buttons show "Comenzar Gratis" because the sandbox session was cleared
    await expect(page.getByRole('link', { name: /Comenzar Gratis/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Ir a mi Panel/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Comenzar a Crear/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Probar Demo con Datos/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /¿Ya tienes una cuenta\? Inicia sesión aquí/i })).not.toBeVisible();

    // Force clear session state explicitly in test to prevent race condition with React useEffect
    await page.evaluate(() => {
      document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      localStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_mode");
    });

    // 6. Verify that going to dashboard now redirects to login because the session was cleared
    await page.goto("/dashboard");
    
    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(header.getByRole('link', { name: /Registrarse/i })).toBeVisible();

    // Navigate back to home and verify header is simplified again
    await page.goto("/");
    await expect(header.getByRole('link', { name: /Iniciar Sesión/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pipeline/i })).not.toBeVisible();
  });

  test("should toggle mobile navigation menu at mobile viewport sizes", async ({ page }) => {
    // 1. Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Assert that the page does not overflow horizontally under mobile viewport
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(mobileOverflow).toBe(false);

    const header = page.locator("header");
    const hamburgerBtn = header.getByRole("button", { name: /Toggle navigation menu/i });
    
    // 2. Verify hamburger button is visible, but desktop menu links are hidden
    await expect(hamburgerBtn).toBeVisible();
    
    // Desktop links container should be hidden or its links should not be visible in header
    const desktopLinksContainer = header.locator(".hidden.lg\\:flex");
    await expect(desktopLinksContainer).toBeHidden();

    // Mobile menu dropdown should be hidden initially
    const mobileMenu = page.getByTestId("mobile-menu");
    await expect(mobileMenu).toBeHidden();

    // 3. Click hamburger menu to open
    await hamburgerBtn.click();

    // Verify mobile menu and links are visible
    await expect(mobileMenu).toBeVisible();
    
    const beneficiosMobileLink = mobileMenu.locator("a:has-text('Beneficios')");
    await expect(beneficiosMobileLink).toBeVisible();
    
    const comoFuncionaMobileLink = mobileMenu.locator("a:has-text('Cómo Funciona')");
    await expect(comoFuncionaMobileLink).toBeVisible();

    // 4. Click hamburger menu again to close
    await hamburgerBtn.click();

    // Verify mobile menu is hidden
    await expect(mobileMenu).toBeHidden();

    // 5. Verify that on desktop size the hamburger button is hidden and desktop links are visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(hamburgerBtn).toBeHidden();
    await expect(desktopLinksContainer).toBeVisible();

    // Assert that the page does not overflow horizontally under desktop viewport
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(desktopOverflow).toBe(false);
  });

  test("should allow navigating the app in demo mode without redirecting to login", async ({ page }) => {
    // 1. Start on home page and click "Probar Demo"
    await page.goto("/");
    await page.getByRole('link', { name: /Probar Demo/i }).first().click();
    
    // Verify we landed on /dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to documents page via Sidebar (without demo parameter in url)
    await page.getByRole('link', { name: /Documentos/i }).first().click();
    await page.waitForURL(/\/dashboard\/documents/);
    await expect(page).toHaveURL(/\/dashboard\/documents/);
    await expect(page.locator("h1").first()).toContainText("Expediente de Documentos");

    // 3. Navigate to new contract page
    await page.getByRole('link', { name: /Nuevo Contrato/i }).first().click();
    await page.waitForURL(/\/contracts\/new/);
    await expect(page).toHaveURL(/\/contracts\/new/);
    await expect(page.locator("h1").first()).toContainText("Crear Nuevo Contrato");
  });
});
