// Email composer modal: Compose + Recipients tabs, editable contact list, sends via Resend.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Agent } from "@/frontend/agentUi";

// Textarea that grows in height to fit its content (used for editable cells)
function AutoGrowTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Resize to fit the content whenever the value changes
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none overflow-hidden rounded border border-transparent px-2 py-1.5 text-sm outline-none hover:border-gray-200 focus:border-indigo-400"
    />
  );
}

// Predefined message categories shown in the "Reason" dropdown
const REASONS = [
  "Quote request",
  "Quotation follow-up",
  "General follow-up",
  "Issue resolution",
  "Business opportunity",
  "Post-event message",
  "Marketing",
  "Other",
];

// One editable recipient row
interface Recipient {
  id: string;
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  specification: string;
}

// Split an agent's comma-separated contacts into recipient rows + note ones with no email
function parseAgents(agents: Agent[]): { recipients: Recipient[]; removed: string[] } {
  const recipients: Recipient[] = [];
  const removed: string[] = [];
  const isPhone = (t: string) => /^[+\d][\d\s()./-]{5,}$/.test(t);

  agents.forEach((a) => {
    const tokens = (a.contacts || "").split(",").map((t) => t.trim()).filter(Boolean);
    const emails = tokens.filter((t) => t.includes("@"));
    const names = tokens.filter((t) => !t.includes("@") && !isPhone(t));
    if (emails.length === 0) {
      removed.push(a.company);
      return;
    }
    emails.forEach((email, i) => {
      // Drop honorifics (Mr./Mrs./Dr. …) so the real first/last name is detected
      const parts = (names[i] || names[0] || "")
        .split(/\s+/)
        .filter((p) => p && !/^(mr|mrs|ms|miss|mx|dr|eng|prof|sir|madam|mme|herr|frau)\.?$/i.test(p));
      recipients.push({
        id: `${a.id}-${i}`,
        company: a.company,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
        email,
        specification: "",
      });
    });
  });

  return { recipients, removed };
}

export default function EmailComposer({ agents, onClose }: { agents: Agent[]; onClose: () => void }) {
  const parsed = useMemo(() => parseAgents(agents), [agents]);

  const [tab, setTab] = useState<"compose" | "recipients">("compose");
  const [reason, setReason] = useState(REASONS[4]); // Business opportunity
  const [from, setFrom] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Dear {name},\n\n");
  const [recipients, setRecipients] = useState<Recipient[]>(parsed.recipients);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  // Resizable recipient-table column widths (px)
  type ColKey = "company" | "firstName" | "lastName" | "email" | "specification";
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>({
    company: 240, firstName: 150, lastName: 150, email: 280, specification: 170,
  });

  // Drag a column border to resize it (min 80px)
  const startResize = (key: ColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[key];
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(80, startW + (ev.clientX - startX));
      setColWidths((prev) => ({ ...prev, [key]: w }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Update one field of a recipient row
  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const removeRecipient = (id: string) => setRecipients((prev) => prev.filter((r) => r.id !== id));
  const addRecipient = () =>
    setRecipients((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, company: "", firstName: "", lastName: "", email: "", specification: "" },
    ]);

  // Send: validate, then POST to the Resend-backed API
  const handleSend = async () => {
    setError("");
    setResult(null);
    const valid = recipients.filter((r) => r.email.includes("@"));
    if (valid.length === 0) {
      setError("Add at least one recipient with a valid email.");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm this is not a spam message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: valid.map((r) => ({ email: r.email, name: r.firstName || r.company })),
          subject,
          body,
          from,
          cc: cc.split(",").map((c) => c.trim()).filter(Boolean),
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) setResult({ sent: data.sent?.length || 0, failed: data.failed?.length || 0 });
      else setError(data.error || "Failed to send emails.");
    } catch {
      setError("Failed to send emails.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Panel slides in from the right (GPU-composited transform) */}
      <motion.div
        className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">New E-mail</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Build your message and review the recipient list before sending.
              <br />
              The email will be sent individually to each contact.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(["compose", "recipients"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "recipients" ? `Recipients (${recipients.length})` : "Compose"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "compose" ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">Select the reason for this message and write your email below.</p>

              <div>
                <label className="mb-1 block text-xs font-semibold text-indigo-600">Reason for the message</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">From (optional)</label>
                  <input
                    type="text"
                    value={from}
                    placeholder="verified sender (uses default if blank)"
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Cc (optional)</label>
                  <input
                    type="text"
                    value={cc}
                    placeholder="comma-separated"
                    onChange={(e) => setCc(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Subject</label>
                <input
                  type="text"
                  value={subject}
                  placeholder="Email subject"
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Message</label>
                <p className="mb-1 text-xs text-gray-400">Use <span className="font-mono">{"{name}"}</span> to insert each contact&apos;s name.</p>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Companies with no contacts, removed from the send list */}
              {parsed.removed.length > 0 && (
                <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  The following companies do not have available contacts and have been removed from the recipient list.
                  <div className="mt-1 flex flex-wrap gap-1">
                    {parsed.removed.map((c) => (
                      <span key={c} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={addRecipient}
                className="w-fit rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add Recipient
              </button>

              {/* Editable recipient table — drag column borders to resize */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table
                  className="text-left text-sm table-fixed border-collapse"
                  style={{ width: Object.values(colWidths).reduce((a, b) => a + b, 40) }}
                >
                  <colgroup>
                    {(["company", "firstName", "lastName", "email", "specification"] as const).map((k) => (
                      <col key={k} style={{ width: colWidths[k] }} />
                    ))}
                    <col style={{ width: 40 }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      {([
                        ["company", "Company Name"],
                        ["firstName", "First Name"],
                        ["lastName", "Last Name"],
                        ["email", "E-mail"],
                        ["specification", "Specification"],
                      ] as [ColKey, string][]).map(([key, label]) => (
                        <th key={key} className="relative border-r border-gray-200 px-2 py-2 font-medium">
                          {label}
                          {/* Drag handle on the column's right edge */}
                          <span
                            onMouseDown={startResize(key)}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-300"
                          />
                        </th>
                      ))}
                      <th className="px-2 py-2" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100">
                        {(["company", "firstName", "lastName", "email", "specification"] as const).map((field) => (
                          <td key={field} className="border-r border-gray-100 p-1 align-top">
                            {field === "specification" ? (
                              // Grows taller as you type so long text stays visible
                              <AutoGrowTextarea
                                value={r[field]}
                                onChange={(v) => updateRecipient(r.id, field, v)}
                              />
                            ) : (
                              <input
                                value={r[field]}
                                onChange={(e) => updateRecipient(r.id, field, e.target.value)}
                                className="w-full rounded border border-transparent px-2 py-1.5 text-sm outline-none hover:border-gray-200 focus:border-indigo-400"
                              />
                            )}
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            onClick={() => removeRecipient(r.id)}
                            aria-label="Remove"
                            title="Remove"
                            className="text-gray-400 hover:text-red-500"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                    {recipients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-6 text-center text-gray-400">No recipients.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Spam confirmation */}
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-indigo-600"
                />
                I confirm that this is not a spam message and I take full responsibility for its content
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          {error && <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {result && (
            <div className={`mb-2 rounded-lg px-3 py-2 text-sm ${result.failed === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              Sent {result.sent} email{result.sent !== 1 ? "s" : ""}{result.failed > 0 ? `, ${result.failed} failed` : ""}.
            </div>
          )}
          <div className="flex justify-end gap-2">
            {tab === "compose" ? (
              <button
                onClick={() => setTab("recipients")}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={sending || !confirmed}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
