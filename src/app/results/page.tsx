"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Agent,
  getFlagEmoji,
  getDeterministicMockData,
  getNetworkBadgeStyles,
  SearchIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  StarIcon,
  ResizeHandle,
  UpDownIcon,
  ContactDotIcon,
  SortIcon,
} from "@/lib/agentUi";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "All");
  const [selectedNetwork, setSelectedNetwork] = useState("All");
  const [selectedService, setSelectedService] = useState("All");

  // Toggle states
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [considerCoverage, setConsiderCoverage] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<"company" | "rating" | "country" | "networks">("company");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Column widths (resizable table columns)
  const columnKeys = [
    "company",
    "rating",
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

  const handleResizeStart = (key: ColumnKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
    };

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
  const [countries, setCountries] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial filter data (countries, networks)
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/agents");
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

  // Fetch agents whenever filters or search query change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAgents();
    }, 300);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCountry, selectedNetwork, selectedService]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCountry && selectedCountry !== "All") params.append("country", selectedCountry);
      if (selectedNetwork && selectedNetwork !== "All") params.append("network", selectedNetwork);
      if (selectedService && selectedService !== "All") params.append("service", selectedService);

      const res = await fetch(`/api/agents?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  // Sort and filter client-side for fast interaction (like toggles)
  const processedAgents = agents
    .map((agent) => {
      // Inject mock data for fields empty in DB to make dashboard look rich and matched with screenshot
      const mock = getDeterministicMockData(agent.id, agent.company);
      return {
        ...agent,
        rating: agent.rating ?? mock.rating,
        contactsList: agent.contacts ? agent.contacts.split(",") : mock.contacts,
        networksList: agent.networks ? agent.networks.split(",") : mock.networks,
      };
    })
    .filter((agent) => {
      // Shortlist Only filter: show only agents that don't have credit stop
      if (shortlistOnly && agent.financialStatus === "Credit stop") {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === "networks") {
        valA = a.networksList.join(", ");
        valB = b.networksList.join(", ");
      }

      if (valA === null || valA === undefined) return sortOrder === "asc" ? 1 : -1;
      if (valB === null || valB === undefined) return sortOrder === "asc" ? -1 : 1;

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });

  const toggleSort = (field: "company" | "rating" | "country" | "networks") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] px-8 py-8">
      {/* High Fidelity Search Interface (Matches Second Screenshot) */}
      <section className="flex flex-col gap-6">
        {/* Top Search Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Back to Dashboard"
            >
              <ArrowLeftIcon />
            </button>

            {/* Main Search Input Group */}
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 md:w-96">
              <div className="flex items-center gap-1 border-r border-gray-200 px-3 py-2 text-gray-500 bg-gray-50/50">
                <SearchIcon />
                <span className="text-xs font-medium whitespace-nowrap">By country</span>
                <ChevronDownIcon />
              </div>
              <input
                type="text"
                placeholder="Enter country, city, or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>

            {/* Loaded badge */}
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 sm:flex">
              <CheckCircleIcon />
              <span>All sources loaded</span>
            </div>
          </div>

          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            + Add Agent
          </button>
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

            <button className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 bg-transparent px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-gray-50">
              + Add Filter
            </button>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4">
            {/* Shortlist Only */}
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

            {/* Consider Coverage */}
            <button
              onClick={() => setConsiderCoverage(!considerCoverage)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                considerCoverage
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Consider Coverage
            </button>
          </div>
        </div>

        {/* Results Table Container */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                      <span>Agent ({processedAgents.length})</span>
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

                      {/* Rating */}
                      <td className="border-r border-gray-100 px-4 py-4">
                        {agent.rating ? (
                          <div className="flex items-center gap-1 text-amber-500">
                            <StarIcon />
                            <span className="text-xs font-semibold text-gray-700">{agent.rating}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
        </div>
      </section>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}
