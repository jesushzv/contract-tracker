const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  
  const header = page.locator('header');
  await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
  console.log('Got Iniciar Sesión!');
  
  console.log('Document Cookie on /:', await page.evaluate(() => document.cookie));
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  console.log('Document Cookie on /login:', await page.evaluate(() => document.cookie));
  
  const html2 = await page.content();
  console.log('HTML2 has Mi Panel?', html2.includes('Mi Panel'));
  
  await browser.close();
})();
