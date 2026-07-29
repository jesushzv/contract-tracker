const { chromium } = require("@playwright/test");
const H264mp4encoder = require("h264-mp4-encoder");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const WIDTH = 412;
const HEIGHT = 892;
const FPS = 24;

async function recordCUJ1() {
  console.log("=== Starting Recording CUJ 1: Contract Creation Flow ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const frames = [];
  let isRecording = true;

  // CDP session for fast frame capture
  const client = await context.newCDPSession(page);
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1,
  });

  client.on("Page.screencastFrame", async (event) => {
    if (isRecording) {
      frames.push(Buffer.from(event.data, "base64"));
    }
    await client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
  });

  // Navigate and perform actions
  await page.goto("http://localhost:3000/contracts/new?demo=true");
  await page.waitForTimeout(1000);

  // Step 1: Fill inputs
  const clientNameInput = page.locator('input[placeholder*="nombre" i], input[placeholder*="empresa" i]').first();
  if (await clientNameInput.isVisible()) {
    await clientNameInput.fill("Estudio Creativo MX");
  }

  const clientEmailInput = page.locator('input[type="email"], input[placeholder*="correo" i]').first();
  if (await clientEmailInput.isVisible()) {
    await clientEmailInput.fill("contacto@estudiocreativo.mx");
  }

  const scopeInput = page.locator('textarea').first();
  if (await scopeInput.isVisible()) {
    await scopeInput.fill("Diseño de Marca & Sitio Web Next.js");
  }

  await page.waitForTimeout(1000);

  // Click Step 1 Next
  const nextBtn1 = page.locator('button:has-text("Continuar")').first();
  if (await nextBtn1.isVisible() && await nextBtn1.isEnabled()) {
    await nextBtn1.click();
    await page.waitForTimeout(1200);
  }

  // Step 2 Next
  const nextBtn2 = page.locator('button:has-text("Continuar")').first();
  if (await nextBtn2.isVisible() && await nextBtn2.isEnabled()) {
    await nextBtn2.click();
    await page.waitForTimeout(1200);
  }

  // Step 3 Review hold
  await page.waitForTimeout(1500);

  // Submit
  const submitBtn = page.locator('button:has-text("Crear y Activar Contrato"), button:has-text("Crear Contrato")').first();
  if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
    await submitBtn.click();
    await page.waitForTimeout(2500);
  }

  isRecording = false;
  await client.send("Page.stopScreencast").catch(() => {});
  await browser.close();

  console.log(`Captured ${frames.length} frames for CUJ 1. Encoding to H.264 MP4...`);

  // Encode frames using H264mp4encoder
  const encoder = await H264mp4encoder.createH264MP4Encoder();
  encoder.width = WIDTH;
  encoder.height = HEIGHT;
  encoder.frameRate = FPS;
  encoder.kbps = 4000;
  encoder.initialize();

  for (let i = 0; i < frames.length; i++) {
    const rawRgba = await sharp(frames[i])
      .resize(WIDTH, HEIGHT)
      .ensureAlpha()
      .raw()
      .toBuffer();
    encoder.addFrameRgba(new Uint8Array(rawRgba));
  }

  encoder.finalize();
  const mp4Buf = encoder.FS.readFile(encoder.outputFilename);
  encoder.delete();

  const targetPath = path.join(process.cwd(), "branding", "video_assets", "cuj1_contract_creation_demo.mp4");
  const publicPath = path.join(process.cwd(), "public", "branding", "video_assets", "cuj1_contract_creation_demo.mp4");

  fs.writeFileSync(targetPath, mp4Buf);
  fs.writeFileSync(publicPath, mp4Buf);

  console.log(`Successfully generated CUJ 1 MP4 video (${mp4Buf.length} bytes) at ${targetPath}`);
}

async function recordCUJ2() {
  console.log("=== Starting Recording CUJ 2: WhatsApp OTP Client Signing Flow ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const frames = [];
  let isRecording = true;

  const client = await context.newCDPSession(page);
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1,
  });

  client.on("Page.screencastFrame", async (event) => {
    if (isRecording) {
      frames.push(Buffer.from(event.data, "base64"));
    }
    await client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
  });

  await page.goto("http://localhost:3000/c/c2-landing-page?demo=true");
  await page.waitForTimeout(1500);

  // Click Sign Contract button
  const signBtn = page.locator('button:has-text("Aceptar y Firmar"), button:has-text("Firmar Contrato")').first();
  if (await signBtn.isVisible()) {
    await signBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[placeholder*="nombre" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Mariana Rosas");
      await page.waitForTimeout(500);

      const otpReqBtn = page.locator('button:has-text("Enviar Código"), button:has-text("Generar")').first();
      if (await otpReqBtn.isVisible()) {
        await otpReqBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const otpInput = page.locator('input[placeholder*="OTP" i], input[placeholder*="código" i], input[type="text"]').first();
    if (await otpInput.isVisible()) {
      await otpInput.fill("123456");
      await page.waitForTimeout(500);

      const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Firmar")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2500);
      }
    }
  }

  isRecording = false;
  await client.send("Page.stopScreencast").catch(() => {});
  await browser.close();

  console.log(`Captured ${frames.length} frames for CUJ 2. Encoding to H.264 MP4...`);

  const encoder = await H264mp4encoder.createH264MP4Encoder();
  encoder.width = WIDTH;
  encoder.height = HEIGHT;
  encoder.frameRate = FPS;
  encoder.kbps = 4000;
  encoder.initialize();

  for (let i = 0; i < frames.length; i++) {
    const rawRgba = await sharp(frames[i])
      .resize(WIDTH, HEIGHT)
      .ensureAlpha()
      .raw()
      .toBuffer();
    encoder.addFrameRgba(new Uint8Array(rawRgba));
  }

  encoder.finalize();
  const mp4Buf = encoder.FS.readFile(encoder.outputFilename);
  encoder.delete();

  const targetPath = path.join(process.cwd(), "branding", "video_assets", "cuj2_whatsapp_otp_signing_demo.mp4");
  const publicPath = path.join(process.cwd(), "public", "branding", "video_assets", "cuj2_whatsapp_otp_signing_demo.mp4");

  fs.writeFileSync(targetPath, mp4Buf);
  fs.writeFileSync(publicPath, mp4Buf);

  console.log(`Successfully generated CUJ 2 MP4 video (${mp4Buf.length} bytes) at ${targetPath}`);
}

async function main() {
  await recordCUJ1();
  await recordCUJ2();
  console.log("=== All MP4 Video Demos Generated Successfully ===");
}

main().catch((err) => {
  console.error("Error generating MP4 demos:", err);
  process.exit(1);
});
