const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.addInitScript(() => {
    const orig = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      get: function() {
        return orig.get.call(this);
      },
      set: function(val) {
        console.log('SETTING COOKIE:', val);
        if (new Error().stack) console.log(new Error().stack);
        orig.set.call(this, val);
      }
    });
  });
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  
  const header = page.locator('header');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
  
  console.log('Cookie on /:', await page.evaluate(() => document.cookie));
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  console.log('Cookie on /login:', await page.evaluate(() => document.cookie));
  
  await browser.close();
})();
