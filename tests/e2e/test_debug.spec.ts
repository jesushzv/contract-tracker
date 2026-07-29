import { test, expect } from "@playwright/test";

test("debug header state", async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  
  console.log('--- ON HOME PAGE ---');
  await page.waitForTimeout(1000);
  
  const header = page.locator("header");
  await expect(header.getByRole('link', { name: /Iniciar Sesión/i })).toBeVisible();
  
  console.log('--- CLICKING INICIAR SESIÓN ---');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForLoadState('networkidle');
  
  console.log('--- ON LOGIN PAGE ---');
  await page.waitForTimeout(2000);
  
  const cookies = await page.context().cookies();
  console.log('PLAYWRIGHT COOKIES:', cookies);
  
  const headerText = await header.innerText();
  console.log('HEADER TEXT:', headerText);
  
  await expect(header.getByRole('link', { name: /Registrarse/i })).toBeVisible({ timeout: 5000 });
});
