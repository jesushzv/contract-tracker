import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.describe("Sprint SEC: Security Hardening E2E Integration Suite", () => {

  test("should lockout client after 3 invalid OTP attempts", async ({ page }) => {
    await page.goto("/contracts/new?demo=true");
    
    // Fill client info and scope
    await page.fill('input[placeholder="Ej. Sofía Garza, S.A. de C.V."]', "Sofía Garza");
    await page.fill('input[placeholder="sofia@empresa.com"]', "sofia@studioflora.mx");
    await page.fill('textarea[placeholder*="Describe detalladamente los entregables"]', "Diseño web");
    await page.click('button:has-text("Siguiente")');
    
    // Fill budget
    await page.fill('input[name="totalAmount"]', "10000");
    
    // Fill the date for the milestones
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill("2026-07-20");
    await dateInputs.nth(1).fill("2026-08-20");
    
    // Go to step 3
    await page.click('button:has-text("Siguiente Paso")');
    
    // Click submit in Step 3
    await page.click('button:has-text("Crear y Activar Contrato")');
    
    // We are redirected to /dashboard
    await page.waitForURL(url => url.pathname === "/dashboard");
    
    // Extract the ID of the new contract directly from localstorage
    const { newContractId, newContractToken } = await page.evaluate(() => {
      const data = localStorage.getItem("sandbox_contracts");
      const list = data ? JSON.parse(data) : [];
      const newContract = list.find((c: { clientName?: string; id?: string }) => c.clientName === "Sofía Garza");
      return newContract ? { newContractId: newContract.id, newContractToken: newContract.clientAccessToken } : { newContractId: null, newContractToken: null };
    });
    
    expect(newContractId).not.toBeNull();
    const href = `/c/${newContractId}?demo=true&token=${newContractToken}`;
    
    // Go to client portal
    await page.goto(href);
    
    // Verify we are on the client page and it is sent
    await expect(page.locator("body")).toContainText("Revisar y Firmar Aceptación");
    
    // Click "Revisar y Firmar Aceptación"
    await page.click('button:has-text("Revisar y Firmar Aceptación")');
    
    // Step 1: Client Name
    await page.fill('input[placeholder="Escribe tu nombre y apellido"]', "Sofía Garza");
    await page.click('button:has-text("Enviar Código de Firma")');
    
    // Now OTP input is visible
    await expect(page.locator('input[placeholder="••••••"]')).toBeVisible();
    
    // Try 3 invalid OTPs
    const otpInput = page.locator('input[placeholder="••••••"]');
    const submitOtpBtn = page.locator('button:has-text("Verificar y Firmar")');
    
    // Attempt 1
    await otpInput.fill("000000");
    await submitOtpBtn.click();
    await expect(page.locator("body")).toContainText("El código de verificación ingresado es incorrecto.");
    
    // Attempt 2
    await otpInput.fill("000000");
    await submitOtpBtn.click();
    await expect(page.locator("body")).toContainText("El código de verificación ingresado es incorrecto.");
    
    // Attempt 3
    await otpInput.fill("000000");
    await submitOtpBtn.click();
    await expect(page.locator("body")).toContainText("este intento se ha bloqueado");
  });

  test("should allow uploading a valid PDF receipt but reject invalid magic bytes", async ({ page }) => {
    // c4-desarrollo-ecommerce is accepted. We go to its client view
    await page.goto("/c/c4-desarrollo-ecommerce?demo=true&token=token-c4-desarrollo-ecommerce");
    
    // Locate the first hito which is requested, click 'Ya transferí por SPEI'
    await page.click('button:has-text("Ya transferí por SPEI")');
    
    // Payment Modal is open
    await expect(page.locator('h3:has-text("Notificar Transferencia SPEI")')).toBeVisible();
    
    // Fill tracking reference
    await page.fill('input[placeholder="Ej. 182746182903485761 o folio"]', "INVALIDREF");
    
    // Check default file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Create a mock invalid text file named 'receipt.pdf'
    const tempDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const invalidFilePath = path.join(tempDir, "receipt_invalid.pdf");
    fs.writeFileSync(invalidFilePath, "This is not a real PDF file, it's plain text");
    
    // Set file input
    await fileInput.setInputFiles(invalidFilePath);
    
    // Click Notificar Pago to trigger validation
    await page.click('button:has-text("Notificar Pago")');
    await expect(page.locator("body")).toContainText("Firma de archivo inválida");
    
    // Create a valid mock PDF (starts with '%PDF-')
    const validFilePath = path.join(tempDir, "receipt_valid.pdf");
    fs.writeFileSync(validFilePath, "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj");
    
    // Set file input to valid PDF
    await fileInput.setInputFiles(validFilePath);
    
    // Clear and refill tracking reference just in case
    await page.fill('input[placeholder="Ej. 182746182903485761 o folio"]', "INVALIDREF");
    
    // Click submit
    await page.click('button:has-text("Notificar Pago")');
    
    // Modal should close on success and status change to "marked_paid"
    await expect(page.locator("body")).not.toContainText("Notificar Transferencia SPEI");
    await expect(page.locator("body")).toContainText("verificando");
    
    // Clean up files
    fs.unlinkSync(invalidFilePath);
    fs.unlinkSync(validFilePath);
  });
});
