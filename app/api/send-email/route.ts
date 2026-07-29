import { NextRequest, NextResponse } from "next/server";
import { sendSimulatedEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields: to, subject, html" }, { status: 400 });
    }

    await sendSimulatedEmail({ to, subject, html, text });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (err: unknown) {
    console.error("API send-email error:", err);
    const errMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
