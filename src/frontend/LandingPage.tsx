// Landing page UI: search bar with country suggestions, "Get started" cards, and stats widgets.
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CountryFlag, SearchIcon, ChevronRightIcon } from "@/frontend/agentUi";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(""); // Current text in the search box
  const [showSuggestions, setShowSuggestions] = useState(false); // Whether the country dropdown is visible
  const [countries, setCountries] = useState<string[]>([]); // Country names loaded from the API for suggestions
  const [totalAgents, setTotalAgents] = useState<number | null>(null); // Real agent count for the stats card
  const [topCountries, setTopCountries] = useState<{ country: string; count: number }[]>([]); // Top countries by agent count

  // Fetch country list + agent count for suggestions/stats (meta=1 skips the heavy agent rows)
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/agents?meta=1");
        const data = await res.json();
        if (data.success) {
          setCountries(data.countries || []);
          setTotalAgents(data.total ?? null);
          setTopCountries(data.topCountries || []);
        }
      } catch (err) {
        console.error("Error loading filters:", err);
      }
    }
    fetchFilters();
  }, []);

  // Navigate to the results page, carrying the search text and/or country as URL params
  const goToResults = (query?: string, country?: string) => {
    const params = new URLSearchParams();
    const q = query !== undefined ? query : searchQuery;
    if (q) params.append("q", q);
    if (country) params.append("country", country);
    setShowSuggestions(false);
    router.push(`/results?${params.toString()}`);
  };

  // Up to 8 countries whose names contain the current search text (case-insensitive)
  const countrySuggestions =
    searchQuery.trim().length > 0
      ? countries.filter((c) => c.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 8)
      : [];

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Landing Homepage Dashboard — fades in on load */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl bg-gray-200/60 p-5 sm:p-8 lg:p-10"
      >
        {/* Skyforge Agents brand header */}
        <div className="flex flex-col items-center gap-3">
          {/* Logo tile — same "S" lettermark as the favicon/sidebar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path
                d="M44 20c-3-4-10-6-16-4c-6 2-8 8-4 12c3 3 9 3 14 5c6 2 8 8 4 12c-4 4-13 4-18-1"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <circle cx="49" cy="13" r="6" fill="#F97316" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Skyforge <span className="text-indigo-600">Agents</span>
            </div>
            <p className="mt-1.5 text-sm text-gray-500 sm:text-base">
              Your global freight-agent directory — search, shortlist, and connect
            </p>
          </div>
        </div>

        <h1 className="mt-8 text-center text-xl font-semibold text-gray-900 sm:text-2xl">
          Which agent do you{" "}
          <span className="text-indigo-500">need today?</span>
        </h1>

        {/* Search bar with "By country" prefix and live suggestion dropdown */}
        <div className="relative mx-auto mt-8 max-w-3xl">
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
            <div className="flex items-center gap-2 border-r border-gray-200 px-3 py-3 text-gray-500 sm:px-4">
              <SearchIcon />
              <span className="hidden text-sm whitespace-nowrap sm:inline">By country</span>
            </div>
            <input
              type="text"
              placeholder="Search by country or company..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              // Delay hiding so a click on a suggestion still registers before blur closes it
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              // Pressing Enter runs the search with the typed text
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  goToResults();
                }
              }}
              className="min-w-0 flex-1 px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:px-4"
            />
          </div>

          {/* Country suggestions dropdown */}
          {showSuggestions && countrySuggestions.length > 0 && (
            <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {countrySuggestions.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToResults(c)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <CountryFlag country={c} />
                    <span>{c}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </motion.section>

      {/* Bottom stats/activity grid — fades in slightly after the hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="mt-8"
      >
        {/* Network coverage stats (live from the database) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Network Coverage
          </h3>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col gap-4 lg:w-64">
              <div className="flex items-end gap-6">
                <div>
                  {/* Real totals from the database (— while loading) */}
                  <div className="text-3xl font-bold text-gray-900">
                    {totalAgents !== null ? totalAgents.toLocaleString() : "—"}
                  </div>
                  <div className="text-sm text-gray-500">Agents</div>
                </div>
                <div>
                  {/* Coverage = countries with agents out of ~195 countries */}
                  <div className="text-3xl font-bold text-gray-900">
                    {countries.length > 0 ? `${Math.min(100, Math.round((countries.length / 195) * 100))}%` : "—"}
                  </div>
                  <div className="text-sm text-gray-500">Global Coverage</div>
                </div>
              </div>
              <button
                onClick={() => goToResults("")}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View All Agents
              </button>
            </div>

            <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Agents</th>
                    <th className="px-4 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {/* Top countries by agent count, straight from the database */}
                  {topCountries.map((row) => (
                    <tr
                      key={row.country}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => goToResults("", row.country)}
                    >
                      <td className="flex items-center gap-2 px-4 py-3 text-gray-800">
                        <CountryFlag country={row.country} />
                        {row.country}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{row.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400">
                        <ChevronRightIcon />
                      </td>
                    </tr>
                  ))}
                  {topCountries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-400">Loading…</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </motion.section>
    </main>
  );
}
