const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const publicDir = path.join(__dirname, '../public');
const outputDir = path.join(publicDir, 'ads');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read official SVG logo
const logoSvgPath = path.join(publicDir, 'logo.svg');
const logoSvgContent = fs.readFileSync(logoSvgPath, 'utf8');

// HTML Template Generator for 1080x1080 Ads
function createAdHtml({ bgGradient, badgeText, badgeColor, headlineText, cardHtml, ctaText, ctaBg }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1080px;
      height: 1080px;
      font-family: 'Nunito', -apple-system, sans-serif;
      background: ${bgGradient};
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 60px 50px 50px 50px;
      overflow: hidden;
      position: relative;
    }
    
    .header-logo {
      width: 340px;
      height: 85px;
      display: flex;
      justify-content: center;
      align-items: center;
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.35));
    }
    
    .badge {
      display: inline-block;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${badgeColor};
      color: #ffffff;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      margin-bottom: 16px;
    }
    
    .headline {
      font-size: 46px;
      font-weight: 900;
      text-align: center;
      line-height: 1.2;
      max-width: 920px;
      margin-bottom: 24px;
      text-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    
    .main-visual {
      flex: 1;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    
    .footer {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      z-index: 10;
    }
    
    .cta-button {
      padding: 22px 56px;
      border-radius: 18px;
      font-size: 32px;
      font-weight: 800;
      background: ${ctaBg};
      color: #ffffff;
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.25);
    }
    
    .subtext {
      font-size: 22px;
      font-weight: 700;
      color: rgba(255,255,255,0.85);
    }
  </style>
</head>
<body>

  <!-- Official Logo Component -->
  <div class="header-logo">
    ${logoSvgContent.replace(/fill="#0F172A"/g, 'fill="#FFFFFF"').replace(/fill="#64748B"/g, 'fill="#CBD5E1"')}
  </div>

  ${badgeText ? `<div class="badge">${badgeText}</div>` : ''}

  <div class="headline">${headlineText}</div>

  <!-- Center Visual Card -->
  <div class="main-visual">
    ${cardHtml}
  </div>

  <!-- Footer CTA -->
  <div class="footer">
    <div class="cta-button">${ctaText}</div>
    <div class="subtext">Validez legal en México • Código de Comercio Art. 89</div>
  </div>

</body>
</html>`;
}

// Visual Card Layouts
const phoneChatCard = `
<div style="
  width: 540px;
  background: #ffffff;
  border-radius: 36px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  border: 4px solid #334155;
  overflow: hidden;
  position: relative;
  font-family: sans-serif;
">
  <div style="background: #075E54; color: white; padding: 20px 24px; display: flex; align-items: center; gap: 16px;">
    <div style="width: 44px; height: 44px; background: #25D366; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">C</div>
    <div>
      <div style="font-weight: bold; font-size: 22px;">Cliente Proyecto UX</div>
      <div style="font-size: 14px; opacity: 0.8;">En línea</div>
    </div>
  </div>
  <div style="background: #E5DDD5; padding: 30px 24px; min-height: 280px; display: flex; flex-direction: column; gap: 16px; position: relative;">
    <div style="background: white; padding: 16px 20px; border-radius: 18px; max-width: 80%; align-self: flex-start; box-shadow: 0 2px 5px rgba(0,0,0,0.1); color: #111; font-size: 18px;">
      Hola Sofía, ya revisamos el diseño, nos encantó 👍
    </div>
    <div style="background: #DCF8C6; padding: 16px 20px; border-radius: 18px; max-width: 80%; align-self: flex-end; box-shadow: 0 2px 5px rgba(0,0,0,0.1); color: #111; font-size: 18px;">
      ¡Buenísimo! ¿Cuándo queda listo el pago del 2do hito?
    </div>
    <div style="background: white; padding: 16px 20px; border-radius: 18px; max-width: 85%; align-self: flex-start; box-shadow: 0 2px 5px rgba(0,0,0,0.1); color: #666; font-size: 16px; font-style: italic;">
      Visto 14:32 (Sin respuesta hace 5 días...)
    </div>

    <!-- Alert Overlay Card -->
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 92%;
      background: #ef4444;
      color: white;
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 16px 36px rgba(239, 68, 68, 0.6);
      border: 3px solid #ffffff;
    ">
      <div style="font-size: 40px; font-weight: 900;">$15,000 MXN</div>
      <div style="font-size: 22px; font-weight: 800; text-transform: uppercase; margin-top: 4px;">En Riesgo — Sin Contrato</div>
    </div>
  </div>
</div>`;

const legalDocumentCard = `
<div style="
  width: 580px;
  background: #ffffff;
  color: #0F172A;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  position: relative;
">
  <div style="font-size: 24px; font-weight: 800; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
    <span>CONTRATO DE SERVICIOS</span>
    <span style="font-size: 16px; color: #64748B;">ID: MP-8921</span>
  </div>
  <div style="font-size: 18px; line-height: 1.6; color: #334155; margin-bottom: 30px;">
    Entre <strong>Prestador de Servicios (Freelancer)</strong> y <strong>Cliente</strong> para desarrollo de proyecto digital con hitos de pago...
  </div>
  <div style="display: flex; gap: 20px; border-top: 2px dashed #CBD5E1; padding-top: 20px;">
    <div style="flex: 1; text-align: center; font-size: 16px; color: #64748B;">Firma Cliente<br><strong style="color: #0F172A; font-size: 18px;">Acuerdo Verbal</strong></div>
    <div style="flex: 1; text-align: center; font-size: 16px; color: #64748B;">Validez Legal<br><strong style="color: #ef4444; font-size: 18px;">NULA (Sin Firma)</strong></div>
  </div>

  <!-- Stamp -->
  <div style="
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-12deg);
    border: 6px solid #ef4444;
    color: #ef4444;
    font-size: 42px;
    font-weight: 900;
    padding: 12px 30px;
    border-radius: 16px;
    text-transform: uppercase;
    letter-spacing: 3px;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    background: rgba(255,255,255,0.95);
  ">
    SIN VALIDEZ LEGAL
  </div>
</div>`;

const wizard3MinCard = `
<div style="
  width: 580px;
  background: #ffffff;
  color: #0F172A;
  border-radius: 32px;
  padding: 36px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  text-align: center;
  border: 4px solid #00ACC1;
">
  <div style="width: 100px; height: 100px; background: #10B981; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px auto; font-size: 54px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);">
    ✓
  </div>
  <div style="font-size: 34px; font-weight: 900; color: #0F172A; margin-bottom: 8px;">¡Contrato Listo & Firmado!</div>
  <div style="font-size: 22px; color: #059669; font-weight: 800; margin-bottom: 24px;">Tiempo total: 2 min 47 seg ⏱️</div>
  
  <div style="background: #F1F5F9; border-radius: 16px; padding: 20px; text-align: left; display: flex; flex-direction: column; gap: 12px; font-size: 18px;">
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #64748B;">Enviado por:</span>
      <strong style="color: #25D366;">WhatsApp Directo ✅</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #64748B;">Verificación:</span>
      <strong>Código Token OTP ✅</strong>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #64748B;">Cálculo Impuestos:</span>
      <strong>RESICO ISR 1.25% + IVA ✅</strong>
    </div>
  </div>
</div>`;

const trustAuthorityCard = `
<div style="
  width: 600px;
  background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
  color: white;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.6);
  border: 2px solid #6366F1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
">
  <div style="display: flex; align-items: center; gap: 20px;">
    <div style="
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6A1B9A, #00ACC1);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 42px;
      box-shadow: 0 8px 24px rgba(0,172,193,0.4);
    ">
      🔒
    </div>
    <div style="text-align: left;">
      <div style="font-size: 28px; font-weight: 900; color: #38BDF8;">SELLO SHA-256 LEGAL</div>
      <div style="font-size: 18px; color: #E0E7FF;">Criptografía de Grado Bancario</div>
    </div>
  </div>

  <div style="width: 100%; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.15);">
    <div style="font-size: 20px; font-weight: 800; color: #4ADE80; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
      <span>✓</span> Código de Comercio de México (Art. 89)
    </div>
    <div style="font-size: 20px; font-weight: 800; color: #4ADE80; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
      <span>✓</span> Firma Electrónica por Token OTP
    </div>
    <div style="font-size: 20px; font-weight: 800; color: #4ADE80; display: flex; align-items: center; gap: 10px;">
      <span>✓</span> Trazabilidad Banxico SPEI para Hitos
    </div>
  </div>
</div>`;

// Creatives Config List (Clean Production Ads without internal labels)
const creatives = [
  {
    filename: 'ad_pain_ghosted_unpaid.png',
    bgGradient: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%)',
    badgeText: null,
    headlineText: '¿Tu cliente te debe y no tienes cómo comprobarlo?',
    cardHtml: phoneChatCard,
    ctaText: 'Crea Tu Contrato Gratis →',
    ctaBg: 'linear-gradient(135deg, #6A1B9A 0%, #00ACC1 100%)',
  },
  {
    filename: 'ad_pain_red_stamp.png',
    bgGradient: 'linear-gradient(180deg, #111827 0%, #1F2937 100%)',
    badgeText: null,
    headlineText: '¿Tu acuerdo verbal te va a proteger ante un impago?',
    cardHtml: legalDocumentCard,
    ctaText: 'Protege Tus Honorarios →',
    ctaBg: '#ef4444',
  },
  {
    filename: 'ad_speed_3min_wizard.png',
    bgGradient: 'linear-gradient(180deg, #3B0764 0%, #1E1B4B 100%)',
    badgeText: null,
    headlineText: 'Contratos con validez legal en México — en 3 minutos',
    cardHtml: wizard3MinCard,
    ctaText: 'Probar Demo Gratis →',
    ctaBg: 'linear-gradient(135deg, #00ACC1 0%, #059669 100%)',
  },
  {
    filename: 'ad_trust_legal_mexico.png',
    bgGradient: 'linear-gradient(180deg, #0F172A 0%, #0284C7 100%)',
    badgeText: null,
    headlineText: 'Contratos 100% legales para freelancers en México',
    cardHtml: trustAuthorityCard,
    ctaText: 'Empieza Gratis Hoy →',
    ctaBg: 'linear-gradient(135deg, #6A1B9A 0%, #00ACC1 100%)',
  }
];

// Main Render Function
async function renderAllAds() {
  console.log('Launching browser to render high-res branded ad creatives...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

  for (const creative of creatives) {
    const html = createAdHtml(creative);
    await page.setContent(html);
    // Wait for Google Fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    const outputPath = path.join(outputDir, creative.filename);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`Saved branded ad graphic: ${outputPath}`);
  }

  await browser.close();
  console.log('All 4 branded ad creatives generated successfully!');
}

renderAllAds().catch(err => {
  console.error('Failed to render ads:', err);
  process.exit(1);
});
