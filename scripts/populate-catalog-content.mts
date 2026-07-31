import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  catalogContents,
  catalogMcpServers,
} from "../apps/web/src/lib/catalog-content.ts";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envLocal = readFileSync(resolve("apps/web/.env.local"), "utf8");
  const match = envLocal.match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim().replace(/^"|"$/g, "");
}

process.env.DATABASE_URL = loadDatabaseUrl();

const { db } = await import("../packages/db/src/index.ts");

type Meta = Record<string, unknown>;

function asMeta(value: unknown): Meta {
  return value && typeof value === "object" ? { ...(value as Meta) } : {};
}

function needsContent(meta: Meta, externalId: string) {
  return (
    Boolean(catalogContents[externalId]) && typeof meta.content !== "string"
  );
}

function needsServer(meta: Meta, externalId: string) {
  if (!catalogMcpServers[externalId]) return false;
  const server = meta.server;
  if (server && typeof server === "object") {
    const value = server as Meta;
    if (typeof value.command === "string" || typeof value.url === "string") {
      return false;
    }
  }
  return true;
}

function enrich(meta: Meta, externalId: string) {
  const next = { ...meta };
  if (needsContent(next, externalId)) {
    next.content = catalogContents[externalId];
  }
  if (needsServer(next, externalId)) {
    next.server = catalogMcpServers[externalId];
  }
  return next;
}

async function backfillSkills() {
  const rows = await db.profileSkill.findMany();
  let updated = 0;
  for (const row of rows) {
    const meta = asMeta(row.metadata);
    if (!needsContent(meta, row.externalId)) continue;
    await db.profileSkill.update({
      where: { id: row.id },
      data: { metadata: enrich(meta, row.externalId) },
    });
    updated += 1;
  }
  return updated;
}

async function backfillAgents() {
  const rows = await db.profileAgent.findMany();
  let updated = 0;
  for (const row of rows) {
    const meta = asMeta(row.metadata);
    if (!needsContent(meta, row.externalId)) continue;
    await db.profileAgent.update({
      where: { id: row.id },
      data: { metadata: enrich(meta, row.externalId) },
    });
    updated += 1;
  }
  return updated;
}

async function backfillMcps() {
  const rows = await db.profileMcp.findMany();
  let updated = 0;
  for (const row of rows) {
    const meta = asMeta(row.metadata);
    if (!needsServer(meta, row.externalId) && !needsContent(meta, row.externalId)) {
      continue;
    }
    await db.profileMcp.update({
      where: { id: row.id },
      data: { metadata: enrich(meta, row.externalId) },
    });
    updated += 1;
  }
  return updated;
}

async function backfillCollectionItems() {
  const rows = await db.collectionItem.findMany();
  let updated = 0;
  for (const row of rows) {
    const meta = asMeta(row.metadata);
    const should =
      needsContent(meta, row.externalId) || needsServer(meta, row.externalId);
    if (!should) continue;
    await db.collectionItem.update({
      where: { id: row.id },
      data: { metadata: enrich(meta, row.externalId) },
    });
    updated += 1;
  }
  return updated;
}

const [skills, agents, mcps, items] = await Promise.all([
  backfillSkills(),
  backfillAgents(),
  backfillMcps(),
  backfillCollectionItems(),
]);

console.log(
  JSON.stringify(
    {
      updated: { skills, agents, mcps, collectionItems: items },
      catalogContents: Object.keys(catalogContents).length,
      catalogMcpServers: Object.keys(catalogMcpServers).length,
    },
    null,
    2,
  ),
);

await db.$disconnect();
