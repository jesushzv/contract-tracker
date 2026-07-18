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
  
  const html1 = await page.content();
  console.log('HTML1 has Mi Panel?', html1.includes('Mi Panel'));
  console.log('HTML1 has Registrarse?', html1.includes('Registrarse'));
  
  await header.getByRole('link', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/login/);
  await page.waitForTimeout(1000);
  
  const html2 = await page.content();
  console.log('HTML2 has Mi Panel?', html2.includes('Mi Panel'));
  console.log('HTML2 has Registrarse?', html2.includes('Registrarse'));
  
  await browser.close();
})();
