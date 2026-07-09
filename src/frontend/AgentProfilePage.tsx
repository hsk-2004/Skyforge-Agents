// Agent profile page: Mapper-style layout — profile card + overview tabs,
// contacts, partnership data, and a notes/activities column on the right.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Agent, getFlagEmoji, getNetworkBadgeStyles, ArrowLeftIcon } from "@/frontend/agentUi";
import { motion } from "framer-motion";

export default function AgentProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab states (visual, matching the reference design)
  const [overviewTab, setOverviewTab] = useState<"overview" | "segments">("overview");
  const [contactsTab, setContactsTab] = useState("All contacts");

  // Local notes typed into the "Add note" box; shown in the Activities feed
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ text: string; at: Date }[]>([]);

  // Load the agent by the id in the URL
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const data = await res.json();
        if (data.success) setAgent(data.agent);
        else setError(data.error || "Agent not found");
      } catch {
        setError("Failed to load agent");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading agent profile...
      </main>
    );
  }

  if (error || !agent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-gray-500">
        <p>{error || "Agent not found"}</p>
        <button
          onClick={() => router.push("/results")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to results
        </button>
      </main>
    );
  }

  // Split the comma-separated contacts into emails, phones, and names
  const tokens = (agent.contacts || "").split(",").map((t) => t.trim()).filter(Boolean);
  const emails = tokens.filter((t) => t.includes("@"));
  const phones = tokens.filter((t) => !t.includes("@") && /^[+\d][\d\s()./-]{5,}$/.test(t));
  const names = tokens.filter((t) => !emails.includes(t) && !phones.includes(t));

  const networksList = (agent.networks || "").split(",").map((n) => n.trim()).filter(Boolean);
  const initials = agent.company.slice(0, 2).toUpperCase();

  // Overview fields: show the stored value, or an indigo "Add" link like the reference UI
  const overviewFields: { label: string; value: React.ReactNode }[] = [
    {
      label: "Office",
      value: (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700">
          <span>{getFlagEmoji(agent.country)}</span>
          {agent.country}
          {agent.city ? `, ${agent.city}` : ""}
        </span>
      ),
    },
    { label: "Transport Mode", value: agent.transportMode },
    { label: "Coverage", value: agent.coverage },
    { label: "Services", value: agent.services },
    { label: "Operation", value: agent.operation },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Back to results */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        title="Back"
        aria-label="Back"
      >
        <ArrowLeftIcon />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]"
      >
        {/* ------------ Left column: profile, overview, contacts, partnership ------------ */}
        <div className="flex flex-col gap-6">
          {/* Top row: profile card + overview card */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Profile card */}
            <div className="rounded-2xl bg-white shadow-sm">
              {/* Shortlist / Warning toggle bar */}
              <div className="flex items-center justify-between rounded-t-2xl bg-gray-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">Shortlist</span>
                  <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-indigo-600">
                    <span className="absolute right-0.5 h-4 w-4 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Warning</span>
                  <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200">
                    <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white" />
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 p-6">
                {/* Logo circle with company initials */}
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-white text-2xl font-bold text-slate-400">
                  {initials}
                </div>
                <h1 className="text-center text-xl font-semibold text-gray-900">{agent.company}</h1>
                {/* Shortlist chip */}
                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  Shortlist
                </span>
                {agent.financialStatus === "Credit stop" && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Credit Stop</span>
                )}
                <button className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                  Edit Info
                </button>
              </div>
            </div>

            {/* Overview / Segments tabs card */}
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="flex border-b border-gray-200">
                {(["overview", "segments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOverviewTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      overviewTab === tab
                        ? "border-b-2 border-indigo-600 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {overviewTab === "overview" ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
                  {overviewFields.map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="mt-1.5 text-sm">
                        {value ? (
                          <span className="text-gray-700">{value}</span>
                        ) : (
                          <span className="cursor-default font-medium text-indigo-600">Add</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm">
                  <div className="text-sm font-semibold text-gray-800">Segments</div>
                  <div className="mt-1.5">
                    {agent.segments ? (
                      <span className="text-gray-700">{agent.segments}</span>
                    ) : (
                      <span className="cursor-default font-medium text-indigo-600">Add</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contacts */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">Contacts</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Contact category tabs */}
              <div className="flex overflow-x-auto border-b border-gray-200">
                {["All contacts", "Quotes", "Partnership", "Operational", "Financial"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setContactsTab(tab)}
                    className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
                      contactsTab === tab
                        ? "border-b-2 border-indigo-600 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Contact cards on a gray panel */}
              <div className="bg-gray-200/60 p-4">
                {tokens.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">No contacts on file for this agent.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                      <div className="flex flex-col items-center gap-1 px-4 pt-5 pb-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-slate-400">
                          {initials}
                        </div>
                        <div className="mt-1 max-w-full truncate text-sm font-semibold text-gray-900">
                          {names[0] || agent.company}
                        </div>
                        <div className="text-xs text-gray-400">{names.length > 1 ? names.slice(1).join(", ") : "N/A"}</div>
                      </div>
                      {/* Email / phone rows */}
                      <div className="border-t border-gray-100 px-4 py-2.5 text-center text-sm">
                        {emails.length > 0 ? (
                          <a href={`mailto:${emails[0]}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                            {emails[0]}
                          </a>
                        ) : (
                          <span className="text-gray-300">no e-mail</span>
                        )}
                      </div>
                      {phones.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2.5 text-center text-sm">
                          <a href={`tel:${phones[0]}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                            {phones[0]}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Partnership Data */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">Partnership Data</h2>
            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-sm lg:grid-cols-[240px_1fr]">
              {/* Facts column */}
              <div className="flex flex-col gap-5 border-gray-200 lg:border-r lg:pr-6">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Networks</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {networksList.length > 0 ? (
                      networksList.map((n) => (
                        <span key={n} className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getNetworkBadgeStyles(n)}`}>
                          {n}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Rating</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-sm text-amber-600">
                    <span>★</span>
                    <span>{agent.rating ?? "-"}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Financial Status</div>
                  <div className="mt-1.5 text-sm text-gray-700">{agent.financialStatus || <span className="text-gray-300">—</span>}</div>
                </div>
              </div>

              {/* Placeholder panel mirroring the reference layout */}
              <div className="flex min-h-44 flex-col items-center justify-center gap-1 text-center">
                <div className="text-lg font-semibold text-gray-800">More partnership tools coming</div>
                <div className="text-sm text-gray-500">A clearer way to work 😄</div>
              </div>
            </div>
          </section>
        </div>

        {/* ------------ Right column: notes + activities ------------ */}
        <div className="rounded-2xl bg-gray-200/60 p-4">
          {/* Add note box */}
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
                {initials.charAt(0)}
              </div>
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && noteText.trim()) {
                    setNotes([{ text: noteText.trim(), at: new Date() }, ...notes]);
                    setNoteText("");
                  }
                }}
                placeholder="Add note"
                className="min-w-0 flex-1 rounded-lg px-2 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                aria-label="Save note"
                onClick={() => {
                  if (!noteText.trim()) return;
                  setNotes([{ text: noteText.trim(), at: new Date() }, ...notes]);
                  setNoteText("");
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Activities feed */}
          <h3 className="mt-5 mb-3 text-lg font-semibold text-gray-900">Activities</h3>
          <div className="flex flex-col gap-3">
            {/* Locally added notes appear first */}
            {notes.map((note, i) => (
              <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">Note</span>
                  <span className="shrink-0 text-xs text-gray-400">just now</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{note.text}</p>
              </div>
            ))}

            {/* Import event from the database record */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  System
                  <span className="inline-flex items-center gap-1 rounded bg-cyan-100 px-1.5 py-0.5 text-xs font-medium text-cyan-800">
                    Directory
                  </span>
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{agent.company} added to the agent directory.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
