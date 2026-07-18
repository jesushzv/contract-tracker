const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('response', response => {
    const headers = response.headers();
    if (headers['set-cookie']) {
      console.log('SET-COOKIE FROM SERVER:', response.url(), headers['set-cookie']);
    }
  });
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  
  const header = page.locator('header');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
