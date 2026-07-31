import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../generated/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envLocal = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
  const match = envLocal.match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim().replace(/^"|"$/g, "");
}

const pool = new pg.Pool({ connectionString: loadDatabaseUrl() });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const profile = await db.profile.findFirst({
  where: { slug: "meu-perfil", owner: { username: "luizfilipeschaeffer" } },
  include: { skills: true, agents: true, mcps: true, owner: true },
});

console.log(
  JSON.stringify(
    {
      id: profile?.id,
      name: profile?.name,
      skills: profile?.skills.map((s) => ({
        externalId: s.externalId,
        metadata: s.metadata,
      })),
      agents: profile?.agents.map((s) => ({
        externalId: s.externalId,
        metadata: s.metadata,
      })),
      mcps: profile?.mcps.map((s) => ({
        externalId: s.externalId,
        metadata: s.metadata,
      })),
    },
    null,
    2,
  ),
);

await db.$disconnect();
await pool.end();
