/**
 * Manual catalog sync against DATABASE_URL.
 *
 * Run from repo root:
 *   pnpm exec tsx --tsconfig apps/web/tsconfig.json scripts/run-catalog-sync.mts
 *   pnpm exec tsx --tsconfig apps/web/tsconfig.json scripts/run-catalog-sync.mts --phase=claude
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const rel of [".env", "apps/web/.env.local"]) {
    try {
      const envLocal = readFileSync(resolve(rel), "utf8");
      const match = envLocal.match(/^DATABASE_URL=(.*)$/m);
      if (match) return match[1].trim().replace(/^"|"$/g, "");
    } catch {
      // try next
    }
  }
  throw new Error("DATABASE_URL not found");
}

process.env.DATABASE_URL = loadDatabaseUrl();

const phaseArg = process.argv.find((arg) => arg.startsWith("--phase="));
const phase = (phaseArg?.split("=")[1] ??
  process.argv[2] ??
  "all") as
  | "all"
  | "builtin"
  | "skills-sh"
  | "mcp"
  | "claude"
  | "backfill";

const { runCatalogSync } = await import("../apps/web/src/lib/catalog-sync.ts");

const report = await runCatalogSync(phase);
console.log(JSON.stringify(report, null, 2));

const { db } = await import("../packages/db/src/index.ts");
await db.$disconnect();
