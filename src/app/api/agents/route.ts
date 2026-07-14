// API endpoint: GET (list) and POST (create) /api/agents — thin wrapper around the backend service
import { NextResponse } from "next/server";
import { getAgents, createAgent } from "@/backend/agentsService";

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

// POST /api/agents — create a new agent from the "Add Agent" form
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // company and country are required
    if (!body?.company?.trim() || !body?.country?.trim()) {
      return NextResponse.json({ success: false, error: "Company and country are required" }, { status: 400 });
    }
    const agent = await createAgent(body);
    return NextResponse.json({ success: true, agent }, { status: 201 });
  } catch (error) {
    console.error("Failed to create agent:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
