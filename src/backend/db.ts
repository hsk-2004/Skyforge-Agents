// Shared Prisma client instance for the whole app (backend database access).
// Connects to Turso (hosted libSQL/SQLite) through the driver adapter.
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Store the client on the global object so hot-reload in development
// doesn't create a new database connection on every file change.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Build a client wired to Turso using the env credentials
function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

// Reuse the existing client if one was already created, otherwise create a new one.
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Only cache on the global object outside production (dev hot-reload safety).
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
