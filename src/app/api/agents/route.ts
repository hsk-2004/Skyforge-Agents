import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const network = searchParams.get("network") || "";
    const service = searchParams.get("service") || "";

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
    const networksSet = new Set<string>();
    agentsWithNetworks.forEach(a => {
      if (a.networks) {
        a.networks.split(',').forEach(n => {
          const trimmed = n.trim();
          if (trimmed) networksSet.add(trimmed);
        });
      }
    });
    const networks = Array.from(networksSet).sort();

    return NextResponse.json({
      success: true,
      agents,
      countries,
      networks,
    });
  } catch (error: any) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
