// Landing page UI: search bar with country suggestions, "Get started" cards, and stats widgets.
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GetStartedCard from "@/frontend/GetStartedCard";
import { getFlagEmoji, SearchIcon, ChevronDownIcon, ChevronRightIcon, UserIcon } from "@/frontend/agentUi";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(""); // Current text in the search box
  const [showSuggestions, setShowSuggestions] = useState(false); // Whether the country dropdown is visible
  const [countries, setCountries] = useState<string[]>([]); // Country names loaded from the API for suggestions

  // Stats dashboard mock data (from index.tsx originally)
  const shortlistRows = [
    { flag: "🇮🇳", country: "India", shortlist: 615, warning: 0 },
    { flag: "🇺🇸", country: "United St...", shortlist: 386, warning: 0 },
    { flag: "🇲🇽", country: "Mexico", shortlist: 142, warning: 0 },
  ];

  const activities = [
    { logo: "🇬🇧", name: "FMC LOGISTICS (UK...", detail: "FMC LOGISTICS (UK) Ltd adde...", time: "4hr" },
    { logo: "🇬🇧", name: "Freight Box Ltd", detail: "Freight Box Ltd added to Sh...", time: "4hr" },
    { logo: "🇬🇧", name: "Flexitrans Limited", detail: "Flexitrans Limited added to...", time: "4hr" },
  ];

  // Fetch country list for suggestions
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        if (data.success) {
          setCountries(data.countries || []);
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
        <h1 className="text-center text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">
          Which agent do you{" "}
          <span className="text-indigo-500">need today?</span>
        </h1>

        {/* Search bar with "By country" prefix and live suggestion dropdown */}
        <div className="relative mx-auto mt-8 max-w-3xl">
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
            <div className="flex items-center gap-2 border-r border-gray-200 px-3 py-3 text-gray-500 sm:px-4">
              <SearchIcon />
              <span className="hidden text-sm whitespace-nowrap sm:inline">By country</span>
              <ChevronDownIcon />
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
                    <span>{getFlagEmoji(c)}</span>
                    <span>{c}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Onboarding cards grid */}
        <h2 className="mt-10 text-center text-xl font-semibold text-gray-900">
          Get started
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GetStartedCard
            description="An up-to-date and unified list of all your network agents"
            ctaLabel="Connect Network"
            primary
          />
          <GetStartedCard
            description="Send single or bulk emails to agents without leaving Skyforge Agents"
            ctaLabel="Integrate E-mail"
          />
          <GetStartedCard
            description="Add agents from any source, import in bulk or one by one"
            ctaLabel="Add Agents"
          />
          <GetStartedCard
            description="Empower your entire team and keep them on the same page"
            ctaLabel="Invite Teammates"
          />
        </div>
      </motion.section>

      {/* Bottom stats/activity grid — fades in slightly after the hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]"
      >
        {/* Shortlist Coverage */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Shortlist Coverage
          </h3>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col gap-4 lg:w-64">
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-3xl font-bold text-gray-900">1271</div>
                  <div className="text-sm text-gray-500">Agents</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">25%</div>
                  <div className="text-sm text-gray-500">Global Coverage</div>
                </div>
              </div>
              <button
                onClick={() => goToResults("")}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View All Agents
              </button>

              <div className="mt-2 h-32 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300">
                Map view placeholder
              </div>
            </div>

            <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Shortlist</th>
                    <th className="px-4 py-3 font-medium">Warning</th>
                    <th className="px-4 py-3">
                      <SearchIcon />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shortlistRows.map((row) => (
                    <tr
                      key={row.country}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        goToResults("", row.country === "United St..." ? "United States of America" : row.country)
                      }
                    >
                      <td className="flex items-center gap-2 px-4 py-3 text-gray-800">
                        <span>{row.flag}</span>
                        {row.country}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {row.shortlist}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {row.warning}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <ChevronRightIcon />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activities
            </h3>
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              See all
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                    {activity.logo}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {activity.name}
                      </span>
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                        Shortlist
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {activity.detail}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-gray-400">
                  <UserIcon />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
