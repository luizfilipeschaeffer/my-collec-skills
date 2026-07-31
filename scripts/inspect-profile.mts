import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envLocal = readFileSync(resolve("apps/web/.env.local"), "utf8");
  const match = envLocal.match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim().replace(/^"|"$/g, "");
}

process.env.DATABASE_URL = loadDatabaseUrl();

const { db } = await import("../packages/db/src/index.ts");

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
        hasContent:
          typeof (s.metadata as { content?: unknown } | null)?.content ===
          "string",
        metadata: s.metadata,
      })),
      agents: profile?.agents.map((s) => ({
        externalId: s.externalId,
        hasContent:
          typeof (s.metadata as { content?: unknown } | null)?.content ===
          "string",
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
