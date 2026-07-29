import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

test.use({
  viewport: { width: 412, height: 892 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  video: {
    mode: "on",
    size: { width: 412, height: 892 },
  },
});

test("Record CUJ 1 - Contract Creation Demo MP4", async ({ page }) => {
  await page.goto("http://localhost:3000/contracts/new?demo=true");
  await page.waitForTimeout(1000);

  // Fill Step 1
  const clientNameInput = page.locator('input[placeholder*="nombre" i], input[placeholder*="empresa" i]').first();
  if (await clientNameInput.isVisible()) {
    await clientNameInput.fill("Estudio Creativo MX");
  }

  const clientEmailInput = page.locator('input[type="email"], input[placeholder*="correo" i]').first();
  if (await clientEmailInput.isVisible()) {
    await clientEmailInput.fill("contacto@estudiocreativo.mx");
  }

  const clientPhoneInput = page.locator('input[type="tel"], input[placeholder*="teléfono" i]').first();
  if (await clientPhoneInput.isVisible()) {
    await clientPhoneInput.fill("5512345678");
  }

  const scopeInput = page.locator('textarea').first();
  if (await scopeInput.isVisible()) {
    await scopeInput.fill("Diseño de Marca & Sitio Web Next.js");
  }

  await page.waitForTimeout(1000);

  // Click Next
  const nextBtn1 = page.locator('button:has-text("Continuar")').first();
  if (await nextBtn1.isVisible() && await nextBtn1.isEnabled()) {
    await nextBtn1.click();
    await page.waitForTimeout(1000);
  }

  // Step 2: Financial
  const nextBtn2 = page.locator('button:has-text("Continuar")').first();
  if (await nextBtn2.isVisible() && await nextBtn2.isEnabled()) {
    await nextBtn2.click();
    await page.waitForTimeout(1000);
  }

  // Step 3: Review & Submit
  await page.waitForTimeout(1500); // Rest on summary
  const submitBtn = page.locator('button:has-text("Crear y Activar Contrato"), button:has-text("Crear Contrato")').first();
  if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
    await submitBtn.click();
    await page.waitForTimeout(2500);
  }

  // Save MP4 video path
  const video = page.video();
  if (video) {
    const videoPath = await video.path();
    const targetPath = path.join(process.cwd(), "branding", "video_assets", "cuj1_contract_creation_demo.mp4");
    const publicPath = path.join(process.cwd(), "public", "branding", "video_assets", "cuj1_contract_creation_demo.mp4");
    fs.copyFileSync(videoPath, targetPath);
    fs.copyFileSync(videoPath, publicPath);
    console.log("Saved MP4 video for CUJ 1 to:", targetPath);
  }
});
