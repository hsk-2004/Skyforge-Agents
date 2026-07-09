// Result page UI: searchable/filterable/sortable agent table with resizable columns.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Agent,
  getFlagEmoji,
  getNetworkBadgeStyles,
  SearchIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ResizeHandle,
  UpDownIcon,
  ContactDotIcon,
  SortIcon,
  AgentLogo,
} from "@/frontend/agentUi";
import { motion } from "framer-motion";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state, initialised from the URL query string where available
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "All");
  const [selectedNetwork, setSelectedNetwork] = useState("All");
  const [selectedService, setSelectedService] = useState("All");

  // Toggle states
  const [shortlistOnly, setShortlistOnly] = useState(false);

  // Toast message shown briefly after shortlist actions
  const [toast, setToast] = useState("");
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500); // auto-hide after 2.5s
  };

  // Ids of agents the user has shortlisted (loaded once, updated optimistically)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch("/api/shortlist?ids=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setShortlistedIds(new Set<string>(d.ids || []));
      })
      .catch(() => {});
  }, []);

  // Add/remove a single agent from the shortlist (chip click)
  const toggleShortlist = async (agentId: string) => {
    const isSaved = shortlistedIds.has(agentId);
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
    await fetch("/api/shortlist", {
      method: isSaved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSaved ? { agentId } : { agentIds: [agentId] }),
    });
    showToast(isSaved ? "Agent removed from shortlist" : "Agent added to shortlist successfully");
  };

  // Row selection (checkboxes revealed on row hover)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add every selected agent to the shortlist (action bar button)
  const shortlistSelected = async () => {
    const ids = [...selectedIds];
    setShortlistedIds((prev) => new Set([...prev, ...ids]));
    setSelectedIds(new Set());
    await fetch("/api/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentIds: ids }),
    });
    showToast(`${ids.length} agent${ids.length > 1 ? "s" : ""} added to shortlist successfully`);
  };

  // Sorting
  const [sortBy, setSortBy] = useState<"company" | "rating" | "country" | "networks">("company");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Column widths (resizable table columns)
  const columnKeys = [
    "company",
    "rating", // Rating column is shown, but rendered empty per user request
    "office",
    "coverage",
    "operation",
    "transportMode",
    "services",
    "contacts",
    "segments",
    "networks",
  ] as const;
  type ColumnKey = (typeof columnKeys)[number];
  const defaultColumnWidths: Record<ColumnKey, number> = {
    company: 260,
    rating: 100,
    office: 180,
    coverage: 120,
    operation: 120,
    transportMode: 140,
    services: 120,
    contacts: 220,
    segments: 120,
    networks: 160,
  };
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(defaultColumnWidths);

  // Begin a column-resize drag: track mouse movement until the button is released,
  // updating the dragged column's width live (minimum 60px).
  const handleResizeStart = (key: ColumnKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key];

    // Resize the column as the mouse moves
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
    };

    // Clean up listeners and restore the cursor when the drag ends
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Data states
  const [agents, setAgents] = useState<Agent[]>([]);
  const [totalAgents, setTotalAgents] = useState(0); // full match count (rows are capped server-side)
  const [countries, setCountries] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // true from the start so the first paint shows the spinner, not "no agents"

  // Fetch initial filter data (countries, networks) — meta=1 skips the heavy agent rows
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/agents?meta=1");
        const data = await res.json();
        if (data.success) {
          setCountries(data.countries || []);
          setNetworks(data.networks || []);
        }
      } catch (err) {
        console.error("Error loading filters:", err);
      }
    }
    fetchFilters();
  }, []);

  // Fetch agents whenever filters or search query change (debounced 300ms
  // so we don't hit the API on every keystroke)
  useEffect(() => {
    // Call the backend API with the active filters and store the returned agents
    const fetchAgents = async () => {
      setLoading(true);
      try {
        // Only include parameters for filters that are actually set
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedCountry && selectedCountry !== "All") params.append("country", selectedCountry);
        if (selectedNetwork && selectedNetwork !== "All") params.append("network", selectedNetwork);
        if (selectedService && selectedService !== "All") params.append("service", selectedService);

        const res = await fetch(`/api/agents?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setAgents(data.agents || []);
          setTotalAgents(data.total ?? (data.agents || []).length);
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchAgents, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCountry, selectedNetwork, selectedService]);

  // Return to the home dashboard
  const handleBackToDashboard = () => {
    router.push("/");
  };

  // Sort and filter client-side for fast interaction (like toggles)
  const processedAgents = agents
    .map((agent) => ({
      // Split the comma-separated DB fields into lists; empty fields stay empty (no mock data)
      ...agent,
      contactsList: agent.contacts ? agent.contacts.split(",") : [],
      networksList: agent.networks ? agent.networks.split(",") : [],
    }))
    .filter((agent) => {
      // Shortlist Only filter: show only agents that don't have credit stop
      if (shortlistOnly && agent.financialStatus === "Credit stop") {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pull the values for the active sort column
      let valA: string | number | null = a[sortBy];
      let valB: string | number | null = b[sortBy];

      if (sortBy === "networks") {
        valA = a.networksList.join(", ");
        valB = b.networksList.join(", ");
      }

      // Push null/undefined values to the end regardless of direction
      if (valA === null || valA === undefined) return sortOrder === "asc" ? 1 : -1;
      if (valB === null || valB === undefined) return sortOrder === "asc" ? -1 : 1;

      // Strings compare alphabetically; numbers compare arithmetically
      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0; // Mixed types shouldn't happen; keep original order
    });

  // Clicking a sortable header: same column flips direction, new column sorts ascending
  const toggleSort = (field: "company" | "rating" | "country" | "networks") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* High Fidelity Search Interface (Matches Second Screenshot) */}
      <section className="flex flex-col gap-6">
        {/* Top Search Controls Header — blurred while a selection is active */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 transition-all sm:gap-4 ${
            selectedIds.size > 0 ? "pointer-events-none blur-[1px] opacity-75 select-none" : ""
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={handleBackToDashboard}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Back to Dashboard"
            >
              <ArrowLeftIcon />
            </button>

            {/* Main Search Input Group */}
            <div className="flex w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 sm:w-auto sm:flex-1 md:max-w-96">
              <div className="flex shrink-0 items-center gap-1 border-r border-gray-200 px-3 py-2 text-gray-500 bg-gray-50/50">
                <SearchIcon />
                <span className="hidden text-xs font-medium whitespace-nowrap sm:inline">Search</span>
              </div>
              <input
                type="text"
                placeholder="Enter country, city, or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>

          </div>
        </div>

        {/* Filters Bar — blurred while a selection is active */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 transition-all ${
            selectedIds.size > 0 ? "pointer-events-none blur-[1px] opacity-75 select-none" : ""
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Country Select Filter */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 outline-none"
              >
                <option value="All">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {getFlagEmoji(c)} {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Services Filter Dropdown (Custom Mock options) */}
            <div className="relative">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 outline-none"
              >
                <option value="All">Services</option>
                <option value="Air Freight">Air Freight</option>
                <option value="Ocean Freight">Ocean Freight</option>
                <option value="Customs Brokerage">Customs Brokerage</option>
                <option value="Warehousing">Warehousing</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Networks Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 outline-none"
              >
                <option value="All">Networks</option>
                {networks.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                <ChevronDownIcon />
              </div>
            </div>

          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Shortlist Only — hides agents flagged with a credit stop */}
            <button
              onClick={() => setShortlistOnly(!shortlistOnly)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                shortlistOnly
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Shortlist Only
            </button>
          </div>
        </div>

        {/* Selection action bar — appears when at least one agent is checked */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-lg shadow-sm w-fit border border-gray-200">
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700">
              <span>
                {selectedIds.size} agent{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              {/* Clear the whole selection */}
              <button
                onClick={() => setSelectedIds(new Set())}
                aria-label="Clear selection"
                className="text-indigo-500 hover:text-indigo-800"
              >
                ✕
              </button>
            </div>
            <button
              onClick={shortlistSelected}
              className="bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add to Shortlist
            </button>
            <button
              onClick={() => {
                // Collect the selected agents' email addresses and open the mail client
                const emails = agents
                  .filter((a) => selectedIds.has(a.id) && a.contacts)
                  .flatMap((a) => a.contacts!.split(",").map((t) => t.trim()))
                  .filter((t) => t.includes("@"));
                if (emails.length > 0) window.location.href = `mailto:${[...new Set(emails)].join(",")}`;
              }}
              className="bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Send E-mail
            </button>
          </div>
        )}

        {/* Results Table Container — fades in on load */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <table
              className="text-left text-sm border-collapse table-fixed"
              style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}
            >
              <colgroup>
                {columnKeys.map((key) => (
                  <col key={key} style={{ width: columnWidths[key] }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-500 select-none">
                  {/* Column Agent */}
                  <th
                    className="relative border-r border-gray-200 px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSort("company")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Agent ({totalAgents})</span>
                      <SortIcon active={sortBy === "company"} order={sortOrder} />
                    </div>
                    <ResizeHandle onMouseDown={handleResizeStart("company")} />
                  </th>

                  {/* Column Rating */}
                  <th
                    className="relative border-r border-gray-200 px-4 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSort("rating")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rating</span>
                      <SortIcon active={sortBy === "rating"} order={sortOrder} />
                    </div>
                    <ResizeHandle onMouseDown={handleResizeStart("rating")} />
                  </th>



                  {/* Column Office */}
                  <th
                    className="relative border-r border-gray-200 px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSort("country")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Office</span>
                      <SortIcon active={sortBy === "country"} order={sortOrder} />
                    </div>
                    <ResizeHandle onMouseDown={handleResizeStart("office")} />
                  </th>

                  <th className="relative border-r border-gray-200 px-4 py-3 font-medium">
                    Coverage
                    <ResizeHandle onMouseDown={handleResizeStart("coverage")} />
                  </th>
                  <th className="relative border-r border-gray-200 px-4 py-3 font-medium">
                    Operation
                    <ResizeHandle onMouseDown={handleResizeStart("operation")} />
                  </th>
                  <th className="relative border-r border-gray-200 px-4 py-3 font-medium whitespace-nowrap">
                    Transport Mode
                    <ResizeHandle onMouseDown={handleResizeStart("transportMode")} />
                  </th>
                  <th className="relative border-r border-gray-200 px-4 py-3 font-medium">
                    Services
                    <ResizeHandle onMouseDown={handleResizeStart("services")} />
                  </th>
                  <th className="relative border-r border-gray-200 px-6 py-3 font-medium">
                    Contacts
                    <ResizeHandle onMouseDown={handleResizeStart("contacts")} />
                  </th>
                  <th className="relative border-r border-gray-200 px-4 py-3 font-medium">
                    Segments
                    <ResizeHandle onMouseDown={handleResizeStart("segments")} />
                  </th>

                  {/* Column Networks */}
                  <th
                    className="relative px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSort("networks")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Networks</span>
                      <SortIcon active={sortBy === "networks"} order={sortOrder} />
                    </div>
                    <ResizeHandle onMouseDown={handleResizeStart("networks")} />
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Searching database records...</span>
                      </div>
                    </td>
                  </tr>
                ) : processedAgents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-gray-400">
                      No agents found matching your filters. Try selecting a different country or adjusting filters.
                    </td>
                  </tr>
                ) : (
                  processedAgents.map((agent) => (
                    <tr
                      key={agent.id}
                      className={`group hover:bg-slate-50/50 transition-colors ${
                        agent.financialStatus === "Credit stop" ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Agent / Company */}
                      <td className="relative border-r border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Selection checkbox — revealed on hover, stays visible once checked */}
                          <input
                            type="checkbox"
                            checked={selectedIds.has(agent.id)}
                            onChange={() => toggleSelected(agent.id)}
                            aria-label={`Select ${agent.company}`}
                            className={`h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-indigo-600 transition-opacity group-hover:opacity-100 ${
                              selectedIds.has(agent.id) ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {/* Company logo (falls back to initials) */}
                          <AgentLogo logo={agent.logo} company={agent.company} size={36} />
                          <div>
                            {/* Company name links to the agent profile page */}
                            <button
                              onClick={() => router.push(`/agents/${agent.id}`)}
                              className="block text-left font-medium text-gray-900 hover:text-indigo-600 hover:underline"
                            >
                              {agent.company}
                            </button>
                            {/* Status chip under the name; Shortlist chip toggles saving the agent */}
                            {agent.financialStatus === "Credit stop" ? (
                              <span className="inline-block mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                Credit Stop
                              </span>
                            ) : (
                              <button
                                onClick={() => toggleShortlist(agent.id)}
                                title={shortlistedIds.has(agent.id) ? "Remove from shortlist" : "Add to shortlist"}
                                className={`mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                  shortlistedIds.has(agent.id)
                                    ? "bg-cyan-100 text-cyan-800"
                                    : "border border-dashed border-gray-300 text-gray-400 hover:border-cyan-300 hover:text-cyan-700"
                                }`}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill={shortlistedIds.has(agent.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                </svg>
                                {shortlistedIds.has(agent.id) ? "Shortlist" : "+ Shortlist"}
                              </button>
                            )}
                          </div>
                        </div>
                        {/* "Profile" button pinned top-right, visible while hovering the row */}
                        <button
                          onClick={() => router.push(`/agents/${agent.id}`)}
                          className="absolute right-2 top-2 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity hover:bg-gray-50 focus:opacity-100 group-hover:opacity-100"
                        >
                          Profile
                        </button>
                      </td>

                      {/* Rating (Kept empty per user request) */}
                      <td className="border-r border-gray-100 px-4 py-4 text-center">
                        <span className="text-gray-300">—</span>
                      </td>

                      {/* Office */}
                      <td className="border-r border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-1.5 rounded-md bg-white border border-gray-200 px-2.5 py-1.5 text-xs text-slate-700 w-fit">
                          <UpDownIcon />
                          <span className="font-medium leading-tight">
                            {agent.country}
                            {agent.city ? (
                              <>
                                <br />
                                {agent.city}
                              </>
                            ) : null}
                          </span>
                        </div>
                      </td>

                      {/* Empty placeholder columns matching screenshot */}
                      <td className="border-r border-gray-100 px-4 py-4 text-gray-400 text-xs">—</td>
                      <td className="border-r border-gray-100 px-4 py-4 text-gray-400 text-xs">—</td>
                      <td className="border-r border-gray-100 px-4 py-4 text-gray-400 text-xs">—</td>
                      <td className="border-r border-gray-100 px-4 py-4 text-gray-400 text-xs">—</td>

                      {/* Contacts */}
                      <td className="border-r border-gray-100 px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {agent.contactsList.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                          {agent.contactsList.map((contact, idx) => (
                            <span
                              key={idx}
                              className="inline-flex w-fit items-center gap-1 rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                            >
                              <ContactDotIcon />
                              {contact}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Segments */}
                      <td className="border-r border-gray-100 px-4 py-4 text-gray-400 text-xs">—</td>

                      {/* Networks */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {agent.networksList.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                          {agent.networksList.map((network, idx) => (
                            <span
                              key={idx}
                              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getNetworkBadgeStyles(
                                network
                              )}`}
                            >
                              {network}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Cap notice: server limits rows per response; narrow the search to see the rest */}
          {!loading && totalAgents > agents.length && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-xs text-gray-500">
              Showing the first {agents.length.toLocaleString()} of {totalAgents.toLocaleString()} matching agents — refine your search or filters to narrow the results.
            </div>
          )}
        </motion.div>
      </section>

      {/* Success toast for shortlist actions */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg md:bottom-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </motion.div>
      )}
    </main>
  );
}

// Suspense boundary is required because ResultsContent uses useSearchParams()
export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}
