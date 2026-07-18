const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  const header = page.locator('header');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  const cookies = await page.evaluate(() => document.cookie);
  const local = await page.evaluate(() => JSON.stringify(localStorage));
  const session = await page.evaluate(() => JSON.stringify(sessionStorage));
  
  console.log("COOKIES:", cookies);
  console.log("LOCAL:", local);
  console.log("SESSION:", session);
  
  await browser.close();
})();
