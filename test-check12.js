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
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  const headerHtml = await page.locator('header').innerHTML();
  console.log("HEADER HTML:", headerHtml);
  
  await browser.close();
})();
