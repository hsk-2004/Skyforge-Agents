// API endpoint: GET (fetch) and DELETE (admin-only) /api/agents/:id
import { NextResponse } from "next/server";
import { getAgentById, deleteAgent } from "@/backend/agentsService";
import { auth } from "@/backend/auth";
import { prisma } from "@/backend/db";

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

// DELETE /api/agents/:id — remove an agent (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require a signed-in admin (role checked server-side, never trust the client)
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
