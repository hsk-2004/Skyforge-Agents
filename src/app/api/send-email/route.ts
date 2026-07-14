// API endpoint: POST /api/send-email — sends personalized emails via Resend
import { NextResponse } from "next/server";
import { sendAgentEmails, EmailRecipient } from "@/backend/emailService";

export async function POST(request: Request) {
  try {
    const { recipients, subject, message } = await request.json();

    // Basic validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: "No recipients provided" }, { status: 400 });
    }
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: "Subject and message are required" }, { status: 400 });
    }

    // Keep only recipients that actually have an email address
    const valid: EmailRecipient[] = recipients.filter((r: EmailRecipient) => r?.email?.includes("@"));

    const result = await sendAgentEmails(valid, subject.trim(), message.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to send emails:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
