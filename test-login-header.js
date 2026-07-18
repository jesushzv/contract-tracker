const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  const headerText = await page.locator('header').innerText();
  console.log('HEADER TEXT:', headerText);
  await browser.close();
})();
