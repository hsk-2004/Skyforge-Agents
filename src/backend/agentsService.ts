// Backend service for agents: database queries and filter logic live here.
import { prisma } from "@/backend/db";
import { Prisma } from "@prisma/client";

// Filters accepted by the agent search
export interface AgentFilters {
  search: string;
  country: string;
  network: string;
  service: string;
  metaOnly?: boolean; // skip the row query; only return counts + dropdown lists
}

// Cap rows per response so unfiltered searches don't ship/render 15k+ rows
const MAX_RESULTS = 500;

// Fetch agents matching the filters, plus the dropdown option lists
export async function getAgents({ search, country, network, service, metaOnly }: AgentFilters) {
  // Build the Prisma WHERE clause from whichever filters were provided
  const where: Prisma.AgentWhereInput = {};

  // General search across company, city, and country
  // (SQLite's `contains` is case-insensitive by default, so no mode flag needed)
  if (search) {
    where.OR = [
      { company: { contains: search } },
      { city: { contains: search } },
      { country: { contains: search } },
    ];
  }

  // Specific country filter
  if (country && country !== "All") {
    where.country = { equals: country };
  }

  // Specific network filter
  if (network && network !== "All") {
    where.networks = { contains: network };
  }

  // Specific service filter
  if (service && service !== "All") {
    where.services = { contains: service };
  }

  // Total match count (cheap) plus the capped row query, skipped in meta-only mode
  const total = await prisma.agent.count({ where });
  const agents = metaOnly
    ? []
    : await prisma.agent.findMany({
        where,
        orderBy: { company: "asc" },
        take: MAX_RESULTS,
      });

  // Fetch unique countries for the UI dropdown
  const countriesResult = await prisma.agent.findMany({
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  const countries = countriesResult.map((c) => c.country).filter(Boolean);

  // Fetch unique networks for the UI dropdown
  const agentsWithNetworks = await prisma.agent.findMany({
    select: { networks: true },
    where: { networks: { not: null } },
  });
  // networks is stored as a comma-separated string, so split and dedupe via a Set
  const networksSet = new Set<string>();
  agentsWithNetworks.forEach((a) => {
    if (a.networks) {
      a.networks.split(",").forEach((n) => {
        const trimmed = n.trim();
        if (trimmed) networksSet.add(trimmed);
      });
    }
  });
  const networks = Array.from(networksSet).sort();

  // Top 5 countries by agent count (drives the landing page coverage table)
  const topCountriesRaw = await prisma.agent.groupBy({
    by: ["country"],
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 5,
  });
  const topCountries = topCountriesRaw.map((t) => ({ country: t.country, count: t._count.country }));

  return { agents, total, countries, networks, topCountries };
}
