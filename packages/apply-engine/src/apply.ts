import path from "node:path";
import type { CatalogItem, DocItem, IdeTarget, McpItem, ProfileManifest } from "@mcs/manifest";
import { collectAgents, collectMcps, collectSkills } from "./collect.js";
import { readFileIfExists, writeFileAtomic } from "./fs.js";
import { assertSafeId, resolveSafePath } from "./paths.js";
import type {
  ApplyItemResult,
  ApplyOptions,
  ApplyReport,
} from "./types.js";

interface Ctx {
  cwd: string;
  ide: IdeTarget;
  dryRun: boolean;
  force: boolean;
  results: ApplyItemResult[];
}

function push(
  ctx: Ctx,
  result: ApplyItemResult,
): void {
  ctx.results.push(result);
}

async function applyTextFile(
  ctx: Ctx,
  kind: "skill" | "agent",
  id: string,
  filePath: string,
  content: string,
): Promise<void> {
  const existing = await readFileIfExists(filePath);
  if (existing !== null) {
    if (existing === content) {
      push(ctx, {
        kind,
        id,
        status: "skipped",
        path: filePath,
        message: "Already up to date",
      });
      return;
    }
    if (!ctx.force) {
      push(ctx, {
        kind,
        id,
        status: "skipped",
        path: filePath,
        message: "Exists with different content (use force to overwrite)",
      });
      return;
    }
  }

  if (ctx.dryRun) {
    push(ctx, {
      kind,
      id,
      status: "applied",
      path: filePath,
      message: existing === null ? "Would create" : "Would overwrite",
    });
    return;
  }

  await writeFileAtomic(filePath, content);
  push(ctx, {
    kind,
    id,
    status: "applied",
    path: filePath,
    message: existing === null ? "Created" : "Updated",
  });
}

async function applySkill(ctx: Ctx, item: CatalogItem): Promise<void> {
  try {
    const id = assertSafeId(item.externalId);
    if (!item.content) {
      push(ctx, {
        kind: "skill",
        id,
        status: "skipped",
        message: "No content to write",
      });
      return;
    }
    const skillsDir = resolveSafePath(ctx.cwd, ".cursor", "skills");
    const filePath = resolveSafePath(skillsDir, id, "SKILL.md");
    await applyTextFile(ctx, "skill", id, filePath, item.content);
  } catch (err) {
    push(ctx, {
      kind: "skill",
      id: item.externalId,
      status: "failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function applyAgent(ctx: Ctx, item: CatalogItem): Promise<void> {
  try {
    const id = assertSafeId(item.externalId);
    if (!item.content) {
      push(ctx, {
        kind: "agent",
        id,
        status: "skipped",
        message: "No content to write",
      });
      return;
    }
    const agentsDir = resolveSafePath(ctx.cwd, ".cursor", "agents");
    const filePath = resolveSafePath(agentsDir, `${id}.md`);
    await applyTextFile(ctx, "agent", id, filePath, item.content);
  } catch (err) {
    push(ctx, {
      kind: "agent",
      id: item.externalId,
      status: "failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

type McpJson = {
  mcpServers?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

async function applyMcps(ctx: Ctx, items: McpItem[]): Promise<void> {
  if (items.length === 0) return;

  const mcpPath = resolveSafePath(ctx.cwd, ".cursor", "mcp.json");
  let current: McpJson = { mcpServers: {} };

  const raw = await readFileIfExists(mcpPath);
  if (raw !== null) {
    try {
      current = JSON.parse(raw) as McpJson;
      if (!current.mcpServers || typeof current.mcpServers !== "object") {
        current.mcpServers = {};
      }
    } catch {
      push(ctx, {
        kind: "mcp",
        id: "mcp.json",
        status: "failed",
        path: mcpPath,
        message: "Existing .cursor/mcp.json is not valid JSON",
      });
      return;
    }
  }

  const servers = { ...current.mcpServers };
  let dirty = false;

  for (const item of items) {
    try {
      const id = assertSafeId(item.externalId);
      const nextServer: Record<string, unknown> = {};
      if (item.server.command) nextServer.command = item.server.command;
      if (item.server.args) nextServer.args = item.server.args;
      if (item.server.env) nextServer.env = item.server.env;
      if (item.server.url) nextServer.url = item.server.url;

      const existing = servers[id];
      if (existing && jsonEqual(existing, nextServer)) {
        push(ctx, {
          kind: "mcp",
          id,
          status: "skipped",
          path: mcpPath,
          message: "Already up to date",
        });
        continue;
      }
      if (existing && !ctx.force) {
        push(ctx, {
          kind: "mcp",
          id,
          status: "skipped",
          path: mcpPath,
          message: "Server exists with different config (use force)",
        });
        continue;
      }

      servers[id] = nextServer;
      dirty = true;
      push(ctx, {
        kind: "mcp",
        id,
        status: "applied",
        path: mcpPath,
        message: ctx.dryRun
          ? existing
            ? "Would update"
            : "Would add"
          : existing
            ? "Updated"
            : "Added",
      });
    } catch (err) {
      push(ctx, {
        kind: "mcp",
        id: item.externalId,
        status: "failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!dirty || ctx.dryRun) return;

  const next: McpJson = { ...current, mcpServers: servers };
  await writeFileAtomic(mcpPath, `${JSON.stringify(next, null, 2)}\n`);
}

type DocsJson = {
  docs: DocItem[];
};

async function applyDocs(ctx: Ctx, items: DocItem[]): Promise<void> {
  if (items.length === 0) return;

  const docsPath = resolveSafePath(ctx.cwd, ".mcs", "docs.json");
  let current: DocsJson = { docs: [] };
  const raw = await readFileIfExists(docsPath);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as DocsJson;
      current = { docs: Array.isArray(parsed.docs) ? parsed.docs : [] };
    } catch {
      push(ctx, {
        kind: "doc",
        id: "docs.json",
        status: "failed",
        path: docsPath,
        message: "Existing .mcs/docs.json is not valid JSON",
      });
      return;
    }
  }

  const byKey = new Map(
    current.docs.map((d) => [`${d.source}::${d.externalId}`, d]),
  );
  let dirty = false;

  for (const item of items) {
    try {
      const id = assertSafeId(item.externalId);
      const key = `${item.source}::${id}`;
      const existing = byKey.get(key);
      if (existing && jsonEqual(existing, item)) {
        push(ctx, {
          kind: "doc",
          id,
          status: "skipped",
          path: docsPath,
          message: "Already up to date",
        });
        continue;
      }
      if (existing && !ctx.force) {
        push(ctx, {
          kind: "doc",
          id,
          status: "skipped",
          path: docsPath,
          message: "Doc exists with different data (use force)",
        });
        continue;
      }

      byKey.set(key, item);
      dirty = true;
      push(ctx, {
        kind: "doc",
        id,
        status: "applied",
        path: docsPath,
        message: ctx.dryRun
          ? existing
            ? "Would update"
            : "Would add"
          : existing
            ? "Updated"
            : "Added",
      });
    } catch (err) {
      push(ctx, {
        kind: "doc",
        id: item.externalId,
        status: "failed",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!dirty || ctx.dryRun) return;

  const next: DocsJson = { docs: [...byKey.values()] };
  await writeFileAtomic(docsPath, `${JSON.stringify(next, null, 2)}\n`);
}

function applyExtensions(
  ctx: Ctx,
  extensions: ProfileManifest["extensions"],
): void {
  for (const ext of extensions) {
    if (ext.ide !== ctx.ide) {
      push(ctx, {
        kind: "extension",
        id: ext.id,
        status: "skipped",
        message: `Target IDE is ${ctx.ide}; extension is for ${ext.ide}`,
      });
      continue;
    }

    const command =
      ext.ide === "vscode"
        ? `code --install-extension ${ext.id}`
        : `cursor --install-extension ${ext.id}`;

    push(ctx, {
      kind: "extension",
      id: ext.id,
      status: "applied",
      message: ctx.dryRun
        ? `Would report install command for ${ext.name}`
        : `Install manually: ${ext.name}`,
      command,
    });
  }
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function toReport(ctx: Ctx): ApplyReport {
  return {
    applied: ctx.results.filter((r) => r.status === "applied"),
    skipped: ctx.results.filter((r) => r.status === "skipped"),
    failed: ctx.results.filter((r) => r.status === "failed"),
    dryRun: ctx.dryRun,
  };
}

/**
 * Apply a validated Profile Manifest to the local workspace.
 * Idempotent: identical content is skipped; differing content requires `force`.
 */
export async function applyProfile(
  manifest: ProfileManifest,
  options: ApplyOptions = {},
): Promise<ApplyReport> {
  const ctx: Ctx = {
    cwd: path.resolve(options.cwd ?? process.cwd()),
    ide: options.ide ?? "cursor",
    dryRun: options.dryRun ?? false,
    force: options.force ?? false,
    results: [],
  };

  for (const skill of collectSkills(manifest)) {
    await applySkill(ctx, skill);
  }
  for (const agent of collectAgents(manifest)) {
    await applyAgent(ctx, agent);
  }
  await applyMcps(ctx, collectMcps(manifest));
  await applyDocs(ctx, manifest.docs);
  applyExtensions(ctx, manifest.extensions);

  return toReport(ctx);
}
