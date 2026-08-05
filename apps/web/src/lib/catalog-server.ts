import "server-only";

import { loadCatalogEntriesFromDb } from "@/lib/catalog-sync";
import {
  searchCatalogLive,
  type CatalogItem,
  type CatalogSearchOptions,
} from "@/lib/catalog";
import {
  sortCatalogItemsByUsage,
  withCatalogUsage,
} from "@/lib/catalog-usage";

function dedupeItems(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.source}:${item.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function finalizeCatalogResult(
  items: CatalogItem[],
  source: string,
  options?: CatalogSearchOptions,
) {
  const take = options?.take && options.take > 0 ? options.take : undefined;
  const working =
    options?.sort === "popular" || !take ? items : items.slice(0, take);
  let hydrated = await withCatalogUsage(working);
  if (options?.sort === "popular") {
    hydrated = sortCatalogItemsByUsage(hydrated);
    return {
      items: take ? hydrated.slice(0, take) : hydrated,
      source,
    };
  }
  return { items: hydrated, source };
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
      category: options?.category,
      subcategory: options?.subcategory,
      take:
        options?.sort === "popular"
          ? Math.max(options.take ?? 200, 200)
          : options?.take && options.take > 0
            ? options.take
            : 200,
    });
    if (cached.length === 0 && !options?.category && !options?.subcategory) {
      return finalizeCatalogResult(live.items, live.source, options);
    }

    let items = dedupeItems([...cached, ...live.items]);
    if (options?.category) {
      items = items.filter((item) => item.category?.slug === options.category);
    }
    if (options?.subcategory) {
      items = items.filter(
        (item) => item.subcategory?.slug === options.subcategory,
      );
    }
    return finalizeCatalogResult(
      items,
      Array.from(
        new Set([
          ...cached.map((item) => item.source),
          ...live.source.split("+"),
        ]),
      ).join("+"),
      options,
    );
  } catch {
    return finalizeCatalogResult(live.items, live.source, options);
  }
}
