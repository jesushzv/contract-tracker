const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const headerText = await page.locator('header').innerText();
  console.log('HEADER TEXT:', headerText);
  await browser.close();
})();
