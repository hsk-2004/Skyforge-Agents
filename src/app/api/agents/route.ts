// API endpoint: GET /api/agents — thin wrapper around the backend service
import { NextResponse } from "next/server";
import { getAgents } from "@/backend/agentsService";

export async function GET(request: Request) {
  try {
    // Read optional filter parameters from the query string
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get("search") || "",
      country: searchParams.get("country") || "",
      network: searchParams.get("network") || "",
      service: searchParams.get("service") || "",
      metaOnly: searchParams.get("meta") === "1", // counts + dropdown lists only
    };

    // Delegate the actual database work to the backend service
    const { agents, total, countries, networks, topCountries } = await getAgents(filters);

    // Success response: agents plus the total count and dropdown option lists
    return NextResponse.json({ success: true, agents, total, countries, networks, topCountries });
  } catch (error) {
    // Log server-side and return a 500 so the client can show an error state
    console.error("Failed to fetch agents:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
