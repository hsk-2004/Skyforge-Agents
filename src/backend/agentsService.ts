// Backend service for agents: database queries and filter logic live here.
import { prisma } from "@/backend/db";
import { Prisma } from "@prisma/client";

// Filters accepted by the agent search
export interface AgentFilters {
  search: string;
  country: string;
  network: string;
  service: string;
}

// Fetch agents matching the filters, plus the dropdown option lists
export async function getAgents({ search, country, network, service }: AgentFilters) {
  // Build the Prisma WHERE clause from whichever filters were provided
  const where: Prisma.AgentWhereInput = {};

  // General search across company, city, and country
  if (search) {
    where.OR = [
      { company: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  // Specific country filter
  if (country && country !== "All") {
    where.country = { equals: country, mode: "insensitive" };
  }

  // Specific network filter
  if (network && network !== "All") {
    where.networks = { contains: network, mode: "insensitive" };
  }

  // Specific service filter
  if (service && service !== "All") {
    where.services = { contains: service, mode: "insensitive" };
  }

  // Query the matching agents, sorted alphabetically by company name
  const agents = await prisma.agent.findMany({
    where,
    orderBy: { company: "asc" },
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

  return { agents, countries, networks };
}
