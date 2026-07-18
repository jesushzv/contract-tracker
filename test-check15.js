const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  console.log("Cookies on /:", await page.evaluate(() => document.cookie));
  
  await page.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  
  console.log("Cookies on /login AFTER CLICK:", await page.evaluate(() => document.cookie));
  
  await browser.close();
})();
