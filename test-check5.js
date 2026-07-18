const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => localStorage.clear());
  
  const header = page.locator('header');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(2000); // give time for react logs
  
  await browser.close();
})();
