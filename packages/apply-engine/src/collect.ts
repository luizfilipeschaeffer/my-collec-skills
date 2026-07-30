import type {
  CatalogItem,
  McpItem,
  ProfileManifest,
} from "my-collec-skills-manifest";

export function collectSkills(manifest: ProfileManifest): CatalogItem[] {
  const fromCollections = manifest.collections
    .filter((c) => c.type === "skill")
    .flatMap((c) => c.items);
  return dedupeByExternalId([...manifest.skills, ...fromCollections]);
}

export function collectAgents(manifest: ProfileManifest): CatalogItem[] {
  const fromCollections = manifest.collections
    .filter((c) => c.type === "agent")
    .flatMap((c) => c.items);
  return dedupeByExternalId([...manifest.agents, ...fromCollections]);
}

/** MCP entries with server config come from the top-level `mcps` array. */
export function collectMcps(manifest: ProfileManifest): McpItem[] {
  return dedupeMcps(manifest.mcps);
}

function dedupeByExternalId(items: CatalogItem[]): CatalogItem[] {
  const map = new Map<string, CatalogItem>();
  for (const item of items) {
    if (!map.has(item.externalId)) {
      map.set(item.externalId, item);
    }
  }
  return [...map.values()];
}

function dedupeMcps(items: McpItem[]): McpItem[] {
  const map = new Map<string, McpItem>();
  for (const item of items) {
    if (!map.has(item.externalId)) {
      map.set(item.externalId, item);
    }
  }
  return [...map.values()];
}
