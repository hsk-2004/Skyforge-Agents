// Backend service for per-user agent shortlists.
import { prisma } from "@/backend/db";

// All agents the user has shortlisted (newest first)
export async function getShortlistedAgents(userId: string) {
  const rows = await prisma.shortlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const agentIds = rows.map((r) => r.agentId);
  if (agentIds.length === 0) return [];

  // Fetch the agent records and keep the shortlist order
  const agents = await prisma.agent.findMany({ where: { id: { in: agentIds } } });
  const byId = new Map(agents.map((a) => [a.id, a]));
  return agentIds.map((id) => byId.get(id)).filter(Boolean);
}

// Just the ids — used by the results table to mark shortlisted rows
export async function getShortlistedIds(userId: string) {
  const rows = await prisma.shortlist.findMany({ where: { userId }, select: { agentId: true } });
  return rows.map((r) => r.agentId);
}

// Add agents to the shortlist (ignores ones already saved)
export async function addToShortlist(userId: string, agentIds: string[]) {
  // Skip agents already on the list (SQLite has no skipDuplicates for createMany)
  const existing = await getShortlistedIds(userId);
  const fresh = agentIds.filter((id) => !existing.includes(id));
  if (fresh.length === 0) return;
  await prisma.shortlist.createMany({
    data: fresh.map((agentId) => ({ userId, agentId })),
  });
}

// Remove one agent from the shortlist
export async function removeFromShortlist(userId: string, agentId: string) {
  await prisma.shortlist.deleteMany({ where: { userId, agentId } });
}
