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
        {/* Top Search Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
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

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4">
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
                      className={`hover:bg-slate-50/50 transition-colors ${
                        agent.financialStatus === "Credit stop" ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Agent / Company */}
                      <td className="border-r border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Logo circle */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-slate-400 overflow-hidden">
                            {agent.company.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{agent.company}</span>
                            {agent.financialStatus === "Credit stop" && (
                              <span className="inline-block mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                Credit Stop
                              </span>
                            )}
                          </div>
                        </div>
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
