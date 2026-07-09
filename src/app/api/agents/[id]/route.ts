// API endpoint: GET /api/agents/:id — single agent for the profile page
import { NextResponse } from "next/server";
import { getAgentById } from "@/backend/agentsService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Route params are async in Next.js 15+
    const { id } = await params;
    const agent = await getAgentById(id);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
