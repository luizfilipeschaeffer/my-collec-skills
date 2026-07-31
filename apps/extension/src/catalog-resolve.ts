import type {
  CatalogItemKind,
  ItemManifestInput,
} from "my-collec-skills-apply-engine";
import type { McpServerConfig } from "my-collec-skills-manifest";
import {
  fetchSkillMarkdown,
  type CatalogApiItem,
} from "./api/client.js";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asServer(value: unknown): McpServerConfig | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const command = asString(raw.command);
  const url = asString(raw.url);
  if (!command && !url) return undefined;
  const server: McpServerConfig = {
    ...(command ? { command } : {}),
    ...(url ? { url } : {}),
  };
  if (Array.isArray(raw.args) && raw.args.every((a) => typeof a === "string")) {
    server.args = raw.args;
  }
  if (raw.env && typeof raw.env === "object" && !Array.isArray(raw.env)) {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.env as Record<string, unknown>)) {
      if (typeof v === "string") env[k] = v;
    }
    if (Object.keys(env).length > 0) server.env = env;
  }
  return server;
}

function skillDetailId(item: CatalogApiItem): string | undefined {
  const fromMeta = asString(item.metadata?.skillId);
  if (fromMeta?.includes("/")) return fromMeta;
  if (item.externalId.includes("/")) return item.externalId;
  return undefined;
}

export async function resolveItemManifestInput(
  item: CatalogApiItem,
  options: { apiUrl: string; fetchImpl?: typeof fetch },
): Promise<ItemManifestInput> {
  const type = item.type as CatalogItemKind;
  const content =
    asString(item.metadata?.content) ??
    asString((item as { content?: unknown }).content);
  let resolvedContent = content;
  const server = asServer(item.metadata?.server);

  if (type === "skill" && !resolvedContent && item.source.includes("skills.sh")) {
    const skillId = skillDetailId(item);
    if (skillId) {
      resolvedContent =
        (await fetchSkillMarkdown({
          apiUrl: options.apiUrl,
          skillId,
          fetchImpl: options.fetchImpl,
        })) ?? undefined;
    }
  }

  if ((type === "skill" || type === "agent") && !resolvedContent) {
    throw new Error(
      `Item sem content — não dá para instalar ${type} "${item.name}" (${item.source}/${item.externalId}).`,
    );
  }
  if (type === "mcp" && !server) {
    throw new Error(
      `Item sem server — não dá para instalar MCP "${item.name}" (${item.source}/${item.externalId}).`,
    );
  }

  return {
    type,
    source: item.source,
    externalId: item.externalId,
    name: item.name,
    description: item.description,
    url: item.url,
    content: resolvedContent,
    server,
    metadata: item.metadata,
  };
}
