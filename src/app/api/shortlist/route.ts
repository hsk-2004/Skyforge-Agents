// API endpoint: /api/shortlist — the signed-in user's shortlisted agents
import { NextResponse } from "next/server";
import { auth } from "@/backend/auth";
import {
  getShortlistedAgents,
  getShortlistedIds,
  addToShortlist,
  removeFromShortlist,
} from "@/backend/shortlistService";

// Resolve the current user's id, or null when not signed in
async function currentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

// GET /api/shortlist         → full agent records
// GET /api/shortlist?ids=1   → just the agent ids (lightweight, for the results table)
export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("ids") === "1") {
    return NextResponse.json({ success: true, ids: await getShortlistedIds(userId) });
  }
  return NextResponse.json({ success: true, agents: await getShortlistedAgents(userId) });
}

// POST { agentIds: string[] } → add agents to the shortlist
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { agentIds } = await request.json();
  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    return NextResponse.json({ success: false, error: "agentIds required" }, { status: 400 });
  }
  await addToShortlist(userId, agentIds.map(String));
  return NextResponse.json({ success: true });
}

// DELETE { agentId: string } → remove one agent from the shortlist
export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { agentId } = await request.json();
  if (!agentId) return NextResponse.json({ success: false, error: "agentId required" }, { status: 400 });
  await removeFromShortlist(userId, String(agentId));
  return NextResponse.json({ success: true });
}
