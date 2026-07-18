const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  const cookies = await page.evaluate(() => document.cookie);
  console.log("COOKIES ON /:", cookies);
  
  await browser.close();
})();
