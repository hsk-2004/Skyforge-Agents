// Shortlist page: saved agents with remove, multi-select, and in-app personalized emails via Resend.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Agent, getFlagEmoji, getNetworkBadgeStyles, AgentLogo } from "@/frontend/agentUi";
import { motion } from "framer-motion";

// Pull the first email address out of an agent's comma-separated contacts field
function getAgentEmail(agent: Agent): string | null {
  const tokens = (agent.contacts || "").split(",").map((t) => t.trim());
  return tokens.find((t) => t.includes("@")) || null;
}

export default function ShortlistPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showEmailPanel, setShowEmailPanel] = useState(false);

  // Compose state for the in-app email
  const [subject, setSubject] = useState("Partnership Inquiry — Skyforge Agents");
  const [message, setMessage] = useState(
    "We came across your company on the Skyforge agent directory and would like to explore a potential partnership.\n\nLooking forward to hearing from you.\n\nBest regards,"
  );
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  // Load the user's shortlisted agents
  useEffect(() => {
    async function fetchShortlist() {
      try {
        const res = await fetch("/api/shortlist");
        const data = await res.json();
        if (data.success) setAgents(data.agents || []);
      } catch (err) {
        console.error("Error loading shortlist:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShortlist();
  }, []);

  // Remove one agent from the shortlist (optimistic update)
  const removeAgent = async (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(agentId);
      return next;
    });
    await fetch("/api/shortlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
  };

  // Toggle a single row's selection
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all / clear all
  const allSelected = agents.length > 0 && selectedIds.size === agents.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(agents.map((a) => a.id)));
  };

  // Split the current selection into agents that have an email and those that don't
  const selectedAgents = agents.filter((a) => selectedIds.has(a.id));
  const withEmail = selectedAgents.filter((a) => getAgentEmail(a));
  const withoutEmail = selectedAgents.filter((a) => !getAgentEmail(a));

  // Send personalized emails to every emailable agent via the Resend API
  const sendEmails = async () => {
    setSendResult(null);
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const recipients = withEmail.map((a) => ({ email: getAgentEmail(a)!, name: a.company }));
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ sent: data.sent?.length || 0, failed: data.failed?.length || 0 });
      } else {
        setSendResult({ sent: 0, failed: withEmail.length });
      }
    } catch {
      setSendResult({ sent: 0, failed: withEmail.length });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">
          Shortlisted Agents{!loading && ` (${agents.length})`}
        </h1>
        <button
          onClick={() => router.push("/results")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Browse Agents
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-6"
      >
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading shortlist...</div>
        ) : agents.length === 0 ? (
          // Empty state pointing back to the results page
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-gray-500">No shortlisted agents yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Open an agent list and click its <span className="font-medium text-cyan-700">Shortlist</span> tag to save it here.
            </p>
          </div>
        ) : (
          <>
            {/* Selection toolbar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-indigo-600"
                />
                Select all
              </label>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
                  <button
                    onClick={() => {
                      setSendResult(null);
                      setShowEmailPanel(true);
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-nowrap ${
                    selectedIds.has(agent.id) ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-200"
                  }`}
                >
                  {/* Row selection checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(agent.id)}
                    onChange={() => toggleSelected(agent.id)}
                    aria-label={`Select ${agent.company}`}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-indigo-600"
                  />
                  <AgentLogo logo={agent.logo} company={agent.company} size={44} />
                  <div className="min-w-0 flex-1">
                    {/* Name links to the agent profile */}
                    <button
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="block max-w-full truncate text-left font-medium text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {agent.company}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>
                        {getFlagEmoji(agent.country)} {agent.country}
                        {agent.city ? `, ${agent.city}` : ""}
                      </span>
                      {/* Email presence hint */}
                      {getAgentEmail(agent) ? (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">Has email</span>
                      ) : (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">No email</span>
                      )}
                      {(agent.networks || "")
                        .split(",")
                        .map((n) => n.trim())
                        .filter(Boolean)
                        .map((n) => (
                          <span key={n} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getNetworkBadgeStyles(n)}`}>
                            {n}
                          </span>
                        ))}
                    </div>
                  </div>
                  {/* Remove from shortlist */}
                  <button
                    onClick={() => removeAgent(agent.id)}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Email compose panel — writes and sends in-app via Resend */}
      {showEmailPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowEmailPanel(false)}>
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
              <button onClick={() => setShowEmailPanel(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Recipients summary */}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                {withEmail.length} will be emailed
              </span>
              {withoutEmail.length > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
                  {withoutEmail.length} skipped (no email)
                </span>
              )}
            </div>

            {/* List of skipped agents so the user knows who wasn't contacted */}
            {withoutEmail.length > 0 && (
              <details className="mt-2 text-sm text-gray-500">
                <summary className="cursor-pointer">Show skipped agents</summary>
                <ul className="mt-1 flex flex-col gap-1">
                  {withoutEmail.map((a) => (
                    <li key={a.id} className="rounded bg-gray-50 px-2 py-1">{a.company}</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Subject + message */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Message</label>
              <p className="mb-1 text-xs text-gray-400">Each email automatically starts with &quot;Dear &lt;agent name&gt;,&quot;</p>
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Send result feedback */}
            {sendResult && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  sendResult.failed === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                Sent {sendResult.sent} email{sendResult.sent !== 1 ? "s" : ""}
                {sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ""}.
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEmailPanel(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={sendEmails}
                disabled={sending || withEmail.length === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {sending ? "Sending..." : `Send to ${withEmail.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
