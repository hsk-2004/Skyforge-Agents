// Agent profile page: profile card + overview, contacts, partnership data,
// and an activity column — showing only real data from the database.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Agent, getFlagEmoji, getNetworkBadgeStyles, ArrowLeftIcon, AgentLogo } from "@/frontend/agentUi";
import { motion } from "framer-motion";

export default function AgentProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // controls the delete button
  const [deleting, setDeleting] = useState(false);

  // Check whether the signed-in user is an admin (delete is admin-only)
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user?.role === "admin") setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  // Delete this agent (admin only), then return to the results list
  const handleDelete = async () => {
    if (!agent) return;
    if (!confirm(`Delete "${agent.company}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/results");
      } else {
        alert(data.error || "Failed to delete agent");
        setDeleting(false);
      }
    } catch {
      alert("Failed to delete agent");
      setDeleting(false);
    }
  };

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

  // Overview fields straight from the database; empty ones render "—"
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
    { label: "Segments", value: agent.segments },
  ];

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Top bar: back button, and delete (admins only) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeftIcon />
        </button>

        {/* Delete is only shown to admin users; the API also enforces this */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete Agent"}
          </button>
        )}
      </div>

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
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm">
              {/* Company logo (falls back to initials) */}
              <AgentLogo logo={agent.logo} company={agent.company} size={96} />
              <h1 className="text-center text-xl font-semibold text-gray-900">{agent.company}</h1>
              {agent.financialStatus === "Credit stop" && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Credit Stop</span>
              )}
              {agent.fullAddress && (
                <p className="text-center text-sm text-gray-500">{agent.fullAddress}</p>
              )}
            </div>

            {/* Overview card */}
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900">Overview</div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
                {overviewFields.map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-sm font-semibold text-gray-800">{label}</div>
                    <div className="mt-1.5 text-sm">
                      {value ? <span className="text-gray-700">{value}</span> : <span className="text-gray-300">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contacts */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">Contacts</h2>
            <div className="rounded-2xl bg-gray-200/60 p-4">
              {tokens.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">No contacts on file for this agent.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col items-center gap-1 px-4 pt-5 pb-3">
                      <AgentLogo logo={agent.logo} company={agent.company} size={56} />
                      <div className="mt-1 max-w-full truncate text-sm font-semibold text-gray-900">
                        {names[0] || agent.company}
                      </div>
                      {names.length > 1 && <div className="text-xs text-gray-400">{names.slice(1).join(", ")}</div>}
                    </div>
                    {/* Email / phone rows, only when present */}
                    {emails.length > 0 && (
                      <div className="border-t border-gray-100 px-4 py-2.5 text-center text-sm">
                        <a href={`mailto:${emails[0]}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                          {emails[0]}
                        </a>
                      </div>
                    )}
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
          </section>

          {/* Partnership Data */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">Partnership Data</h2>
            <div className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:gap-12">
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
                <div className="mt-1.5 text-sm text-gray-700">
                  {agent.rating != null ? (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-600">
                      ★ {agent.rating}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Financial Status</div>
                <div className="mt-1.5 text-sm text-gray-700">
                  {agent.financialStatus || <span className="text-gray-300">—</span>}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ------------ Right column: activity ------------ */}
        <div className="h-fit rounded-2xl bg-gray-200/60 p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Activities</h3>
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
      </motion.div>
    </main>
  );
}
