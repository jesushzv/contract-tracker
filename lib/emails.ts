import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";

export interface EmailParams {
  to: string;
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

export async function sendSimulatedEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, react, text } = params;
  let html = params.html || "";

  if (react) {
    html = await render(react);
  }

  console.log(`📨 [Email Dispatch] Sent to: ${to} | Subject: ${subject}`);

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log("⚡ Resend API Key detected. Dispatching real email via Resend API...");
      const response = await resend.emails.send({
        from: "Mi Pacto <hola@mipacto.app>",
        to,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error("❌ Resend API response error:", response.error);
      } else {
        console.log("✅ Real email dispatched successfully through Resend API.", response.data);
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
