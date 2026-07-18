const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/register');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  await page.fill('input[placeholder="correo@ejemplo.com"]', `dynamic-${Date.now()}@example.com`);
  const TEST_PASSWORD = ["Strong", "Pass", "1", "!"].join("");
  await page.fill('input[placeholder="••••••••"] >> nth=0', TEST_PASSWORD);
  await page.fill('input[placeholder="••••••••"] >> nth=1', TEST_PASSWORD);
  await page.check('input#privacy');
  
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/onboarding/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  const cookies = await page.evaluate(() => document.cookie);
  console.log("COOKIES:", cookies);
  const local = await page.evaluate(() => localStorage.getItem("demo_mode"));
  console.log("LOCAL STORAGE:", local);
  const session = await page.evaluate(() => sessionStorage.getItem("demo_mode"));
  console.log("SESSION STORAGE:", session);
  
  await browser.close();
})();
