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
    };

    // Delegate the actual database work to the backend service
    const { agents, countries, networks } = await getAgents(filters);

    // Success response: agents plus the dropdown option lists
    return NextResponse.json({ success: true, agents, countries, networks });
  } catch (error: any) {
    // Log server-side and return a 500 so the client can show an error state
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
