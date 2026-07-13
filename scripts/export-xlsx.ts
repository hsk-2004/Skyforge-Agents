// Dump all Postgres tables into a single Excel workbook (one sheet per table).
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Minimal env loader; .env.local (local Postgres) forced to win over Prisma's auto-loaded .env
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
loadEnv(".env");
loadEnv(".env.local", true);

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function main() {
  // Pull every row from each table
  const agents = await prisma.agent.findMany();
  const users = await prisma.user.findMany();

  // New workbook, one sheet per table
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agents), "Agents");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), "Users");

  // Write the file next to the project root
  XLSX.writeFile(wb, "db-export.xlsx");
  console.log(`Exported ${agents.length} agents and ${users.length} users -> db-export.xlsx`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
