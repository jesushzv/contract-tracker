const fs = require('fs');
let content = fs.readFileSync('tests/e2e/saas_auth_onboarding.spec.ts', 'utf8');
content = content.replace(/await page\.goto\(("[^"]+")\);/g, "await page.goto($1);\n    await page.waitForLoadState('networkidle');");
fs.writeFileSync('tests/e2e/saas_auth_onboarding.spec.ts', content);
