const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/');
  
  try {
    const header = page.locator('header');
    await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
    console.log('SUCCESS: Link is visible');
  } catch (e) {
    console.error('ERROR:', e.message);
    const html = await page.content();
    console.log(html);
  }
  
  await browser.close();
})();
