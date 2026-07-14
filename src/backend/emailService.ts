// Sends personalized emails to agents through the Resend API (https://resend.com).
// Uses the REST endpoint directly so no extra dependency is required.

export interface EmailRecipient {
  email: string;
  name: string; // agent name, inserted after "Dear" in each email
}

export interface SendResult {
  sent: string[]; // emails that went out successfully
  failed: { email: string; error: string }[]; // emails that Resend rejected
}

// Send one personalized email per recipient; greeting is "Dear <name>,"
export async function sendAgentEmails(
  recipients: EmailRecipient[],
  subject: string,
  message: string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // From must be an address on a domain verified in your Resend account
  const from = process.env.RESEND_FROM || "Skyforge Agents <onboarding@resend.dev>";
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const result: SendResult = { sent: [], failed: [] };

  // Resend has no bulk-personalized endpoint, so send one request per agent
  for (const r of recipients) {
    const text = `Dear ${r.name},\n\n${message}`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [r.email], subject, text }),
      });
      if (res.ok) result.sent.push(r.email);
      else result.failed.push({ email: r.email, error: await res.text() });
    } catch (e) {
      result.failed.push({ email: r.email, error: e instanceof Error ? e.message : "Request failed" });
    }
  }

  return result;
}
