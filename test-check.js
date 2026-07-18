const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();
  
  // Set up console listener to debug
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  const html = await page.content();
  console.log(html.includes('Iniciar Sesión') ? 'FOUND Iniciar Sesión' : 'NOT FOUND');
  console.log(html.includes('Mi Panel') ? 'FOUND Mi Panel' : 'NOT FOUND');
  
  await browser.close();
})();
