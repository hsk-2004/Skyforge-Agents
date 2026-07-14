// Sends personalized emails to agent contacts through the Resend API (https://resend.com).
// Uses the REST endpoint directly so no extra dependency is required.

export interface EmailRecipient {
  email: string;
  name: string; // used to replace the {name} placeholder in the body
}

export interface SendOptions {
  from?: string; // sender override (must be a verified Resend domain address)
  cc?: string[]; // optional Cc addresses added to every email
  reason?: string; // message category, prefixed into the subject
}

export interface SendResult {
  sent: string[]; // emails that went out successfully
  failed: { email: string; error: string }[]; // emails Resend rejected
}

// Send one email per recipient; "{name}" in the body is replaced per recipient
export async function sendAgentEmails(
  recipients: EmailRecipient[],
  subject: string,
  body: string,
  opts: SendOptions = {}
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // From must be an address on a domain verified in your Resend account
  const from = opts.from?.trim() || process.env.RESEND_FROM || "Skyforge Agents <onboarding@resend.dev>";
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  // Prefix the reason category into the subject when provided
  const fullSubject = opts.reason ? `[${opts.reason}] ${subject}` : subject;

  const result: SendResult = { sent: [], failed: [] };

  // Resend has no bulk-personalized endpoint, so send one request per contact
  for (const r of recipients) {
    const text = body.replace(/\{name\}/g, r.name || "there");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [r.email],
          cc: opts.cc && opts.cc.length > 0 ? opts.cc : undefined,
          subject: fullSubject,
          text,
        }),
      });
      if (res.ok) result.sent.push(r.email);
      else result.failed.push({ email: r.email, error: await res.text() });
    } catch (e) {
      result.failed.push({ email: r.email, error: e instanceof Error ? e.message : "Request failed" });
    }
  }

  return result;
}
