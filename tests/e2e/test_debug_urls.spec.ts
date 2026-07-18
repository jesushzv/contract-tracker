import { test, expect } from "@playwright/test";

test("debug 500 urls", async ({ page }) => {
  page.on('response', response => {
    if (response.status() === 500) {
      console.log('500 ERROR URL:', response.url());
    }
  });
  
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(2000);
});
