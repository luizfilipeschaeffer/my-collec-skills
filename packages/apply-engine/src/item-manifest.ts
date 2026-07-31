import type {
  CatalogItem,
  DocItem,
  McpItem,
  McpServerConfig,
  ProfileManifest,
} from "my-collec-skills-manifest";
import { parseProfileManifest } from "my-collec-skills-manifest";
import { assertSafeId, assertSafeMcpKey } from "./paths.js";

export type CatalogItemKind = "skill" | "agent" | "mcp" | "doc";

export interface ItemManifestInput {
  type: CatalogItemKind;
  source: string;
  externalId: string;
  name: string;
  description?: string;
  url?: string;
  content?: string;
  server?: McpServerConfig;
  metadata?: Record<string, unknown>;
}

function slugifySegment(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "item";
}

/** Filesystem-safe id: registry paths like `owner/skill` → `owner__skill`. */
export function toFilesystemId(externalId: string): string {
  const normalized = externalId.trim().replace(/[\\/]+/g, "__");
  return assertSafeId(normalized);
}

function withCatalogId(
  metadata: Record<string, unknown> | undefined,
  catalogExternalId: string,
  filesystemId: string,
): Record<string, unknown> | undefined {
  if (catalogExternalId === filesystemId && !metadata) return metadata;
  return {
    ...metadata,
    catalogExternalId,
  };
}

function emptyManifest(base: {
  username: string;
  slug: string;
  name: string;
  description?: string;
}): ProfileManifest {
  return parseProfileManifest({
    version: 1,
    username: base.username,
    slug: base.slug,
    name: base.name,
    description: base.description,
    collections: [],
    skills: [],
    agents: [],
    mcps: [],
    docs: [],
    extensions: [],
  });
}

/**
 * Build a valid Profile Manifest v1 that contains a single catalog item.
 * Used by CLI/extension marketplace install flows.
 */
export function buildItemManifest(item: ItemManifestInput): ProfileManifest {
  const source = item.source.trim();
  const externalId = item.externalId.trim();
  const name = item.name.trim();

  if (!source) throw new Error("Catalog item source is required");
  if (!externalId) throw new Error("Catalog item externalId is required");
  if (!name) throw new Error("Catalog item name is required");

  const username = "catalog";
  const slug = `${item.type}-${slugifySegment(externalId)}`;
  const manifest = emptyManifest({
    username,
    slug,
    name,
    description: item.description,
  });

  switch (item.type) {
    case "skill": {
      const fsId = toFilesystemId(externalId);
      const skill: CatalogItem = {
        source,
        externalId: fsId,
        name,
        description: item.description,
        content: item.content,
        metadata: withCatalogId(item.metadata, externalId, fsId),
      };
      return { ...manifest, skills: [skill] };
    }
    case "agent": {
      const fsId = toFilesystemId(externalId);
      const agent: CatalogItem = {
        source,
        externalId: fsId,
        name,
        description: item.description,
        content: item.content,
        metadata: withCatalogId(item.metadata, externalId, fsId),
      };
      return { ...manifest, agents: [agent] };
    }
    case "mcp": {
      if (!item.server) {
        throw new Error("MCP item requires server config (command or url)");
      }
      const mcpKey = assertSafeMcpKey(externalId);
      const mcp: McpItem = {
        source,
        externalId: mcpKey,
        name,
        description: item.description,
        server: item.server,
        metadata: item.metadata,
      };
      return { ...manifest, mcps: [mcp] };
    }
    case "doc": {
      const fsId = toFilesystemId(externalId);
      const doc: DocItem = {
        source,
        externalId: fsId,
        name,
        description: item.description,
        url: item.url,
        metadata: withCatalogId(item.metadata, externalId, fsId),
      };
      return { ...manifest, docs: [doc] };
    }
    default: {
      const _exhaustive: never = item.type;
      throw new Error(`Unsupported catalog item type: ${_exhaustive}`);
    }
  }
}