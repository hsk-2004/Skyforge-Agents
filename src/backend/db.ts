// Shared Prisma client instance for the whole app (backend database access).
// Connects to PostgreSQL via the DATABASE_URL connection string.
import { PrismaClient } from "@prisma/client";

// Store the client on the global object so hot-reload in development
// doesn't create a new database connection on every file change.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Reuse the existing client if one was already created, otherwise create a new one.
export const prisma = globalForPrisma.prisma || new PrismaClient();

// Only cache on the global object outside production (dev hot-reload safety).
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
