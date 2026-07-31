import path from "node:path";
import type { CatalogItem, DocItem, IdeTarget, McpItem, ProfileManifest } from "my-collec-skills-manifest";
import { collectAgents, collectMcps, collectSkills } from "./collect.js";
import { readFileIfExists, writeFileAtomic } from "./fs.js";
import { expandIdeTargets, getIdeLayout, type IdeLayout } from "./layout.js";
import { assertSafeId, assertSafeMcpKey, resolveSafePath } from "./paths.js";
import type {
  ApplyItemResult,
  ApplyOptions,
  ApplyReport,
  IdeApplyTarget,
} from "./types.js";

interface Ctx {
  cwd: string;
  ide: IdeTarget;
  layout: IdeLayout;
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
    const skillsDir = resolveSafePath(ctx.cwd, ...ctx.layout.skillsDir);
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
    const agentsDir = resolveSafePath(ctx.cwd, ...ctx.layout.agentsDir);
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

  const mcpPath = resolveSafePath(ctx.cwd, ...ctx.layout.mcpFile);
  const mcpLabel = ctx.layout.mcpFile.join("/");
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
        message: `Existing ${mcpLabel} is not valid JSON`,
      });
      return;
    }
  }

  const servers = { ...current.mcpServers };
  let dirty = false;

  for (const item of items) {
    try {
      const id = assertSafeMcpKey(item.externalId);
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
  results: ApplyItemResult[],
  dryRun: boolean,
  targets: IdeTarget[],
  extensions: ProfileManifest["extensions"],
): void {
  const allowed = new Set(targets);
  const targetLabel = targets.join("+");

  for (const ext of extensions) {
    if (!allowed.has(ext.ide)) {
      results.push({
        kind: "extension",
        id: ext.id,
        status: "skipped",
        message: `Target IDE is ${targetLabel}; extension is for ${ext.ide}`,
      });
      continue;
    }

    const command =
      ext.ide === "vscode"
        ? `code --install-extension ${ext.id}`
        : `cursor --install-extension ${ext.id}`;

    results.push({
      kind: "extension",
      id: ext.id,
      status: "applied",
      message: dryRun
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

function makeCtx(
  cwd: string,
  ide: IdeTarget,
  dryRun: boolean,
  force: boolean,
  results: ApplyItemResult[],
): Ctx {
  return {
    cwd,
    ide,
    layout: getIdeLayout(ide),
    dryRun,
    force,
    results,
  };
}

/**
 * Apply a validated Profile Manifest to the local workspace.
 * Idempotent: identical content is skipped; differing content requires `force`.
 * With `ide: "both"`, skills/agents/MCPs/extensions are applied for Cursor and VS Code;
 * docs (`.mcs/docs.json`) are written once.
 */
export async function applyProfile(
  manifest: ProfileManifest,
  options: ApplyOptions = {},
): Promise<ApplyReport> {
  const choice: IdeApplyTarget = options.ide ?? "cursor";
  const targets = expandIdeTargets(choice);
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;
  const results: ApplyItemResult[] = [];

  const skills = collectSkills(manifest);
  const agents = collectAgents(manifest);
  const mcps = collectMcps(manifest);

  for (const ide of targets) {
    const ctx = makeCtx(cwd, ide, dryRun, force, results);
    for (const skill of skills) {
      await applySkill(ctx, skill);
    }
    for (const agent of agents) {
      await applyAgent(ctx, agent);
    }
    await applyMcps(ctx, mcps);
  }

  applyExtensions(results, dryRun, targets, manifest.extensions);

  // Docs are IDE-agnostic — apply once.
  const docsCtx = makeCtx(cwd, targets[0]!, dryRun, force, results);
  await applyDocs(docsCtx, manifest.docs);

  return toReport(docsCtx);
}
