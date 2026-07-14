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
  // (Postgres `contains` is case-sensitive, so add insensitive mode)
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  // Specific country filter
  if (country && country !== "All") {
    where.country = { equals: country };
  }

  // Specific network filter
  if (network && network !== "All") {
    where.networks = { contains: network, mode: "insensitive" };
  }

  // Specific service filter
  if (service && service !== "All") {
    where.services = { contains: service, mode: "insensitive" };
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

// Fetch a single agent by id for the profile page; returns null when not found
export async function getAgentById(id: string) {
  return prisma.agent.findUnique({ where: { id } });
}

// Delete an agent by id (admin-only; caller must enforce the role check)
export async function deleteAgent(id: string) {
  return prisma.agent.delete({ where: { id } });
}

// Fields accepted when creating a new agent (company + country are required)
export interface NewAgentInput {
  company: string;
  country: string;
  city?: string;
  fullAddress?: string;
  contacts?: string;
  networks?: string;
  services?: string;
  transportMode?: string;
  coverage?: string;
  operation?: string;
  segments?: string;
  financialStatus?: string;
}

// Insert a new agent; trims strings and stores empty optionals as null
export async function createAgent(input: NewAgentInput) {
  const clean = (v?: string) => {
    const t = (v || "").trim();
    return t.length > 0 ? t : null;
  };
  return prisma.agent.create({
    data: {
      company: input.company.trim(),
      country: input.country.trim(),
      city: clean(input.city),
      fullAddress: clean(input.fullAddress),
      contacts: clean(input.contacts),
      networks: clean(input.networks),
      services: clean(input.services),
      transportMode: clean(input.transportMode),
      coverage: clean(input.coverage),
      operation: clean(input.operation),
      segments: clean(input.segments),
      financialStatus: clean(input.financialStatus),
    },
  });
}
