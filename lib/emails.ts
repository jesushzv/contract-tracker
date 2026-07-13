import fs from "fs";
import path from "path";

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendSimulatedEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;

  console.log(`📨 [Email Dispatch] Sent to: ${to} | Subject: ${subject}`);

  // Try using Resend API if API Key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log("⚡ Resend API Key detected. Dispatching real email via Resend API...");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev", // Default domain for sandbox testing
          to,
          subject,
          html
        })
      });

      if (response.ok) {
        console.log("✅ Real email dispatched successfully through Resend API.");
      } else {
        const errDetails = await response.text();
        console.error("❌ Resend API response error:", errDetails);
      }
    } catch (err) {
      console.error("❌ Failed to call Resend API:", err);
    }
  }

  // Always log locally to JSON outbox for E2E validation & testing
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const outboxPath = path.join(dataDir, "simulated_emails.json");
    
    let outbox: unknown[] = [];
    if (fs.existsSync(outboxPath)) {
      try {
        const fileContent = fs.readFileSync(outboxPath, "utf-8");
        outbox = JSON.parse(fileContent);
      } catch {}
    }

    outbox.push({
      id: "email-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      to,
      subject,
      html,
      text,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(outboxPath, JSON.stringify(outbox, null, 2), "utf-8");
    console.log(`💾 Email saved to local outbox log: data/simulated_emails.json`);
  } catch (err) {
    console.error("❌ Failed to write local email outbox log:", err);
  }

  return true;
}
