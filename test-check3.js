const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await context.clearCookies();
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => localStorage.clear());
  
  try {
    const header = page.locator('header');
    await header.getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 5000 });
    console.log('SUCCESS: Link is visible');
  } catch (e) {
    console.error('ERROR:', e.message);
    const html = await page.content();
    // find header in html
    const headerMatch = html.match(/<header.*?<\/header>/s);
    if (headerMatch) console.log("HEADER HTML:", headerMatch[0]);
  }
  
  await browser.close();
})();
