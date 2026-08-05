import { createHash } from "node:crypto";
import {
  catalogContents,
  catalogMcpServers,
} from "@/lib/catalog-content";
import { fetchClaudeCodeCatalogSkills } from "@/lib/claude-code-catalog";
import {
  builtInCatalog,
  type CatalogItem,
  type CatalogItemType,
} from "@/lib/catalog";
import {
  getSkillsShDetail,
  listSkillsShCurated,
  listSkillsShLeaderboard,
  searchSkillsShLegacy,
  searchSkillsShV1,
  skillsShHasOidc,
} from "@/lib/skills-sh";
import { shouldProtectCatalogEntryFromSync } from "@/lib/catalog-contribute-rules";
import {
  catalogEntryInclude,
  toCatalogItem,
} from "@/lib/catalog-contribute";
import { db, type CatalogEntryType, type Prisma } from "@mcs/db";

export type CatalogSyncPhase =
  | "all"
  | "builtin"
  | "skills-sh"
  | "mcp"
  | "claude"
  | "backfill";

export type CatalogSyncReport = {
  phase: CatalogSyncPhase;
  upserted: number;
  unchanged: number;
  backfilled: number;
  errors: string[];
  bySource: Record<string, number>;
};

type SyncItem = {
  type: CatalogItemType;
  source: string;
  externalId: string;
  name: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

const SKILLS_SH_SEED_QUERIES = [
  "react",
  "nextjs",
  "typescript",
  "security",
  "claude",
] as const;

function contentHash(item: SyncItem): string {
  const payload = JSON.stringify({
    content: item.metadata?.content ?? null,
    server: item.metadata?.server ?? null,
    name: item.name,
    description: item.description ?? null,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

function asMeta(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function hasResolvableServer(metadata: Record<string, unknown>): boolean {
  return deriveMcpServer(metadata) !== null;
}

function deriveMcpServer(
  metadata: Record<string, unknown>,
): Record<string, unknown> | null {
  const explicit = metadata.server;
  if (explicit && typeof explicit === "object") {
    const value = explicit as Record<string, unknown>;
    if (typeof value.command === "string" || typeof value.url === "string") {
      return value;
    }
  }

  if (Array.isArray(metadata.packages)) {
    const packageEntry = metadata.packages.find(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object"),
    );
    if (packageEntry && typeof packageEntry.identifier === "string") {
      return {
        command:
          typeof packageEntry.runtimeHint === "string"
            ? packageEntry.runtimeHint
            : "npx",
        args: ["-y", packageEntry.identifier],
      };
    }
  }

  return null;
}

async function upsertItems(
  items: SyncItem[],
  report: CatalogSyncReport,
): Promise<void> {
  for (const item of items) {
    try {
      const hash = contentHash(item);
      const existing = await db.catalogEntry.findUnique({
        where: {
          source_externalId: {
            source: item.source,
            externalId: item.externalId,
          },
        },
      });

      if (existing && shouldProtectCatalogEntryFromSync(existing)) {
        report.unchanged += 1;
        continue;
      }

      if (existing?.contentHash === hash) {
        await db.catalogEntry.update({
          where: { id: existing.id },
          data: { fetchedAt: new Date() },
        });
        report.unchanged += 1;
        continue;
      }

      const data = {
        type: item.type as CatalogEntryType,
        source: item.source,
        externalId: item.externalId,
        name: item.name,
        description: item.description ?? null,
        url: item.url ?? null,
        metadata: (item.metadata ?? {}) as Prisma.InputJsonValue,
        contentHash: hash,
        fetchedAt: new Date(),
      };

      await db.catalogEntry.upsert({
        where: {
          source_externalId: {
            source: item.source,
            externalId: item.externalId,
          },
        },
        create: data,
        update: {
          type: data.type,
          name: data.name,
          description: data.description,
          url: data.url,
          metadata: data.metadata,
          contentHash: data.contentHash,
          fetchedAt: data.fetchedAt,
        },
      });

      report.upserted += 1;
      report.bySource[item.source] = (report.bySource[item.source] ?? 0) + 1;
    } catch (error) {
      report.errors.push(
        `${item.source}/${item.externalId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function syncBuiltin(): SyncItem[] {
  return builtInCatalog.map((item) => {
    const metadata = asMeta(item.metadata);
    const content = catalogContents[item.externalId];
    const server = catalogMcpServers[item.externalId];
    if (content && typeof metadata.content !== "string") {
      metadata.content = content;
    }
    if (server && !hasResolvableServer(metadata)) {
      metadata.server = server;
    }
    return {
      type: item.type,
      source: item.source,
      externalId: item.externalId,
      name: item.name,
      description: item.description,
      url: item.url,
      metadata,
    };
  });
}

async function fetchMcpRegistryItems(limit = 80): Promise<SyncItem[]> {
  try {
    const registryUrl = new URL(
      "https://registry.modelcontextprotocol.io/v0.1/servers",
    );
    registryUrl.searchParams.set("search", "server");
    registryUrl.searchParams.set("version", "latest");
    registryUrl.searchParams.set("limit", String(limit));

    const response = await fetch(registryUrl, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      servers?: Array<{
        server?: {
          name?: string;
          description?: string;
          repository?: { url?: string };
          packages?: unknown[];
        };
      }>;
    };

    return (payload.servers ?? []).flatMap(({ server }) => {
      if (!server?.name) return [];
      const metadata: Record<string, unknown> = {
        packages: server.packages ?? [],
        tags: ["mcp-registry"],
      };
      const fromCatalog = catalogMcpServers[server.name];
      const derived = fromCatalog ?? deriveMcpServer(metadata);
      if (derived) metadata.server = derived;

      return [
        {
          type: "mcp" as const,
          source: "mcp-registry",
          externalId: server.name,
          name: server.name,
          description: server.description ?? "Servidor do MCP Registry.",
          url: server.repository?.url,
          metadata,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function syncSkillsSh(report: CatalogSyncReport): Promise<SyncItem[]> {
  const byId = new Map<string, SyncItem>();

  const push = (item: SyncItem) => {
    byId.set(item.externalId, item);
  };

  const hasOidc = await skillsShHasOidc();

  if (hasOidc) {
    const [leaderboard, curated] = await Promise.all([
      listSkillsShLeaderboard({ view: "all-time", perPage: 80 }),
      listSkillsShCurated(),
    ]);

    for (const skill of [...leaderboard, ...curated]) {
      if (skill.isDuplicate) continue;
      push({
        type: "skill",
        source: "skills.sh",
        externalId: skill.id,
        name: skill.name || skill.slug,
        description: `Skill de ${skill.source} · ${(skill.installs ?? 0).toLocaleString("en-US")} installs`,
        url: skill.url ?? `https://skills.sh/${skill.id}`,
        metadata: {
          tags: ["skills.sh"],
          installs: skill.installs ?? 0,
          skillId: skill.slug,
          repo: skill.source,
          api: "v1",
        },
      });
    }

    for (const query of SKILLS_SH_SEED_QUERIES) {
      const results = await searchSkillsShV1(query, { limit: 30 });
      for (const skill of results) {
        if (skill.isDuplicate) continue;
        push({
          type: "skill",
          source: "skills.sh",
          externalId: skill.id,
          name: skill.name || skill.slug,
          description: `Skill de ${skill.source} · ${(skill.installs ?? 0).toLocaleString("en-US")} installs`,
          url: skill.url ?? `https://skills.sh/${skill.id}`,
          metadata: {
            tags: ["skills.sh", query],
            installs: skill.installs ?? 0,
            skillId: skill.slug,
            repo: skill.source,
            api: "v1",
          },
        });
      }
    }

    // Enrich top N with SKILL.md content
    const topIds = [...byId.values()]
      .sort(
        (a, b) =>
          Number(b.metadata?.installs ?? 0) - Number(a.metadata?.installs ?? 0),
      )
      .slice(0, 50);

    for (const item of topIds) {
      try {
        const detail = await getSkillsShDetail(item.externalId);
        const skillMd = detail?.files?.find(
          (file) =>
            file.path === "SKILL.md" ||
            file.path.endsWith("/SKILL.md") ||
            file.path.toLowerCase().endsWith("skill.md"),
        );
        if (skillMd?.contents) {
          item.metadata = {
            ...item.metadata,
            content: skillMd.contents,
          };
        }
      } catch (error) {
        report.errors.push(
          `skills.sh detail ${item.externalId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } else {
    for (const query of SKILLS_SH_SEED_QUERIES) {
      const results = await searchSkillsShLegacy(query, 20);
      for (const skill of results) {
        push({
          type: "skill",
          source: "skills.sh",
          externalId: skill.id,
          name: skill.name || skill.skillId,
          description: `Skill de ${skill.source} · ${(skill.installs ?? 0).toLocaleString("en-US")} installs`,
          url: `https://skills.sh/${skill.id}`,
          metadata: {
            tags: ["skills.sh", query],
            installs: skill.installs ?? 0,
            skillId: skill.skillId,
            repo: skill.source,
            api: "legacy",
          },
        });
      }
    }
  }

  return [...byId.values()];
}

async function backfillUserItems(report: CatalogSyncReport): Promise<void> {
  const entries = await db.catalogEntry.findMany({
    select: {
      source: true,
      externalId: true,
      metadata: true,
    },
  });

  const byKey = new Map<string, Record<string, unknown>>();
  const byExternalId = new Map<string, Record<string, unknown>>();

  for (const entry of entries) {
    const meta = asMeta(entry.metadata);
    byKey.set(`${entry.source}::${entry.externalId}`, meta);
    if (!byExternalId.has(entry.externalId)) {
      byExternalId.set(entry.externalId, meta);
    }
  }

  async function enrichRow(args: {
    id: string;
    source: string;
    externalId: string;
    metadata: unknown;
    update: (id: string, metadata: Prisma.InputJsonValue) => Promise<unknown>;
  }) {
    const current = asMeta(args.metadata);
    const catalog =
      byKey.get(`${args.source}::${args.externalId}`) ??
      byExternalId.get(args.externalId);
    if (!catalog) return;

    let changed = false;
    if (
      typeof catalog.content === "string" &&
      typeof current.content !== "string"
    ) {
      current.content = catalog.content;
      changed = true;
    }
    if (
      catalog.server &&
      typeof catalog.server === "object" &&
      !hasResolvableServer(current)
    ) {
      current.server = catalog.server;
      changed = true;
    }

    if (!changed) return;
    await args.update(args.id, current as Prisma.InputJsonValue);
    report.backfilled += 1;
  }

  const [skills, agents, mcps, items] = await Promise.all([
    db.profileSkill.findMany(),
    db.profileAgent.findMany(),
    db.profileMcp.findMany(),
    db.collectionItem.findMany(),
  ]);

  for (const row of skills) {
    await enrichRow({
      id: row.id,
      source: row.source,
      externalId: row.externalId,
      metadata: row.metadata,
      update: (id, metadata) =>
        db.profileSkill.update({ where: { id }, data: { metadata } }),
    });
  }
  for (const row of agents) {
    await enrichRow({
      id: row.id,
      source: row.source,
      externalId: row.externalId,
      metadata: row.metadata,
      update: (id, metadata) =>
        db.profileAgent.update({ where: { id }, data: { metadata } }),
    });
  }
  for (const row of mcps) {
    await enrichRow({
      id: row.id,
      source: row.source,
      externalId: row.externalId,
      metadata: row.metadata,
      update: (id, metadata) =>
        db.profileMcp.update({ where: { id }, data: { metadata } }),
    });
  }
  for (const row of items) {
    await enrichRow({
      id: row.id,
      source: row.source,
      externalId: row.externalId,
      metadata: row.metadata,
      update: (id, metadata) =>
        db.collectionItem.update({ where: { id }, data: { metadata } }),
    });
  }
}

function emptyReport(phase: CatalogSyncPhase): CatalogSyncReport {
  return {
    phase,
    upserted: 0,
    unchanged: 0,
    backfilled: 0,
    errors: [],
    bySource: {},
  };
}

export async function runCatalogSync(
  phase: CatalogSyncPhase = "all",
): Promise<CatalogSyncReport> {
  const report = emptyReport(phase);
  const runAll = phase === "all";

  if (runAll || phase === "builtin") {
    await upsertItems(syncBuiltin(), report);
  }

  if (runAll || phase === "skills-sh") {
    try {
      await upsertItems(await syncSkillsSh(report), report);
    } catch (error) {
      report.errors.push(
        `skills-sh: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (runAll || phase === "mcp") {
    try {
      await upsertItems(await fetchMcpRegistryItems(), report);
    } catch (error) {
      report.errors.push(
        `mcp: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (runAll || phase === "claude") {
    try {
      const { items, errors } = await fetchClaudeCodeCatalogSkills();
      report.errors.push(...errors);
      await upsertItems(
        items.map((item) => ({
          type: item.type,
          source: item.source,
          externalId: item.externalId,
          name: item.name,
          description: item.description,
          url: item.url,
          metadata: item.metadata,
        })),
        report,
      );
    } catch (error) {
      report.errors.push(
        `claude: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (runAll || phase === "backfill") {
    try {
      await backfillUserItems(report);
    } catch (error) {
      report.errors.push(
        `backfill: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return report;
}

/** Load cached catalog entries for search/manifest enrichment. */
export async function loadCatalogEntriesFromDb(options?: {
  q?: string;
  type?: string | null;
  take?: number;
  category?: string | null;
  subcategory?: string | null;
  submittedById?: string | null;
}): Promise<CatalogItem[]> {
  const query = options?.q?.trim().toLowerCase() ?? "";
  const type = options?.type;

  const rows = await db.catalogEntry.findMany({
    where: {
      ...(type && type !== "all"
        ? { type: type as CatalogEntryType }
        : {}),
      ...(options?.submittedById ? { submittedById: options.submittedById } : {}),
      ...(options?.category ? { category: { slug: options.category } } : {}),
      ...(options?.subcategory
        ? { subcategory: { slug: options.subcategory } }
        : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { externalId: { contains: query, mode: "insensitive" } },
              { source: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: catalogEntryInclude,
    orderBy: { fetchedAt: "desc" },
    take: options?.take && options.take > 0 ? options.take : 200,
  });

  return rows.map((row) => toCatalogItem(row));
}

export async function lookupCatalogEntryMetadata(
  source: string,
  externalId: string,
): Promise<Record<string, unknown> | null> {
  const exact = await db.catalogEntry.findUnique({
    where: { source_externalId: { source, externalId } },
  });
  if (exact) return asMeta(exact.metadata);

  const byId = await db.catalogEntry.findFirst({
    where: { externalId },
    orderBy: { fetchedAt: "desc" },
  });
  return byId ? asMeta(byId.metadata) : null;
}
