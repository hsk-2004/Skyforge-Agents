// API endpoint: POST /api/send-email — sends personalized emails via Resend
import { NextResponse } from "next/server";
import { sendAgentEmails, EmailRecipient } from "@/backend/emailService";

export async function POST(request: Request) {
  try {
    const { recipients, subject, body, from, cc, reason } = await request.json();

    // Basic validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: "No recipients provided" }, { status: 400 });
    }
    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ success: false, error: "Subject and message are required" }, { status: 400 });
    }

    // Keep only recipients that actually have an email address
    const valid: EmailRecipient[] = recipients
      .filter((r: EmailRecipient) => r?.email?.includes("@"))
      .map((r: EmailRecipient) => ({ email: r.email.trim(), name: (r.name || "").trim() }));

    if (valid.length === 0) {
      return NextResponse.json({ success: false, error: "No valid email addresses" }, { status: 400 });
    }

    // Normalize cc into a string array
    const ccList = Array.isArray(cc) ? cc.filter(Boolean) : cc ? [cc] : [];

    const result = await sendAgentEmails(valid, subject.trim(), body.trim(), {
      from: from?.trim(),
      cc: ccList,
      reason: reason?.trim(),
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to send emails:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
