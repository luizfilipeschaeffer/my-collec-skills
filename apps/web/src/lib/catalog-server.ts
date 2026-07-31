import "server-only";

import { loadCatalogEntriesFromDb } from "@/lib/catalog-sync";
import {
  searchCatalogLive,
  type CatalogItem,
  type CatalogSearchOptions,
} from "@/lib/catalog";

function dedupeItems(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.source}:${item.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Server-only search that prefers the materialized database cache. */
export async function searchCatalog(
  options?: CatalogSearchOptions,
): Promise<{ items: CatalogItem[]; source: string }> {
  const query = options?.q?.trim() ?? "";
  const live = await searchCatalogLive(options);

  try {
    const cached = await loadCatalogEntriesFromDb({
      q: query,
      type: options?.type,
      take: options?.take && options.take > 0 ? options.take : 200,
    });
    if (cached.length === 0) return live;

    const items = dedupeItems([...cached, ...live.items]);
    return {
      items:
        options?.take && options.take > 0
          ? items.slice(0, options.take)
          : items,
      source: Array.from(
        new Set([
          ...cached.map((item) => item.source),
          ...live.source.split("+"),
        ]),
      ).join("+"),
    };
  } catch {
    return live;
  }
}
