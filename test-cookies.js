const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => localStorage.clear());
  
  await page.locator('header').getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForLoadState('networkidle');
  
  const cookies = await page.evaluate(() => document.cookie);
  console.log('COOKIES ON LOGIN:', cookies);
  const headerText = await page.locator('header').innerText();
  console.log('HEADER TEXT:', headerText);
  await browser.close();
})();
