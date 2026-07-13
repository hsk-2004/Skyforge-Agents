// One-off migration: copy all Agent + User rows from Turso (libSQL) into Postgres.
// Reads Turso creds and DATABASE_URL from the environment; upserts by id so it's re-runnable.
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Minimal .env / .env.local loader (no extra deps)
function loadEnv(file: string, override = false) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    const val = m[2].replace(/^["']|["']$/g, "");
    if (override || process.env[m[1]] == null) process.env[m[1]] = val;
  }
}
loadEnv(".env"); // Turso creds
loadEnv(".env.local", true); // force local Postgres DATABASE_URL to win over Prisma's auto-loaded .env

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
// Pass the Postgres URL explicitly so the empty DATABASE_URL in .env can't win
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// Coerce libSQL cell values into the types Prisma expects
const str = (v: unknown) => (v == null ? null : String(v));
const num = (v: unknown) => (v == null ? null : Number(v));
const date = (v: unknown) => (v ? new Date(v as string) : new Date());

async function main() {
  // ---- Agents ----
  const agents = await turso.execute("SELECT * FROM Agent");
  console.log(`Turso has ${agents.rows.length} agents — upserting into Postgres...`);
  let n = 0;
  for (const r of agents.rows as unknown as Record<string, unknown>[]) {
    const data = {
      company: str(r.company)!,
      financialStatus: str(r.financialStatus),
      fullAddress: str(r.fullAddress),
      city: str(r.city),
      country: str(r.country)!,
      rating: num(r.rating),
      coverage: str(r.coverage),
      operation: str(r.operation),
      transportMode: str(r.transportMode),
      services: str(r.services),
      contacts: str(r.contacts),
      segments: str(r.segments),
      networks: str(r.networks),
      logo: str(r.logo),
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    };
    await prisma.agent.upsert({
      where: { id: str(r.id)! },
      create: { id: str(r.id)!, ...data },
      update: data,
    });
    if (++n % 1000 === 0) console.log(`  ...${n}`);
  }

  // ---- Users ----
  const users = await turso.execute("SELECT * FROM User");
  console.log(`Turso has ${users.rows.length} users — upserting...`);
  for (const r of users.rows as unknown as Record<string, unknown>[]) {
    const data = {
      name: str(r.name)!,
      email: str(r.email)!,
      password: str(r.password)!,
      createdAt: date(r.createdAt),
      updatedAt: date(r.updatedAt),
    };
    await prisma.user.upsert({
      where: { id: str(r.id)! },
      create: { id: str(r.id)!, ...data },
      update: data,
    });
  }

  const withLogo = await prisma.agent.count({ where: { NOT: { logo: null } } });
  console.log(`Done. Postgres now has ${n} agents (${withLogo} with logos).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
