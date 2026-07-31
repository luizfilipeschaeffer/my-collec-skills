import {
  catalogContents,
  catalogMcpServers,
} from "@/lib/catalog-content";
import { lookupCatalogEntryMetadata } from "@/lib/catalog-sync";
import {
  canAccessOwnedResource,
  marketplaceCollectionVisibilityWhere,
  marketplaceVisibilityWhere,
} from "@/lib/marketplace-access";
import {
  hasResolvableMcpServer,
  resolveMcpServer,
} from "@/lib/profile-manifest";
import { db, type CollectionType } from "@mcs/db";

export {
  canAccessOwnedResource,
  marketplaceCollectionVisibilityWhere,
  marketplaceVisibilityWhere,
} from "@/lib/marketplace-access";

export type MarketplaceProfileSummary = {
  id: string;
  username: string;
  slug: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isOwned: boolean;
  counts: {
    collections: number;
    skills: number;
    agents: number;
    mcps: number;
    docs: number;
  };
};

export type MarketplaceCollectionSummary = {
  id: string;
  name: string;
  description?: string;
  type: CollectionType;
  category: string;
  subcategory: string;
  ownerUsername: string;
  isPublic: boolean;
  isOwned: boolean;
  itemCount: number;
};

async function enrichItem(item: {
  source: string;
  externalId: string;
  name: string;
  description: string | null;
  metadata: unknown;
}) {
  const metadata =
    item.metadata && typeof item.metadata === "object"
      ? { ...(item.metadata as Record<string, unknown>) }
      : {};

  let cached: Record<string, unknown> | null = null;
  try {
    cached = await lookupCatalogEntryMetadata(item.source, item.externalId);
  } catch {
    cached = null;
  }

  const catalogContent =
    (typeof cached?.content === "string" ? cached.content : undefined) ??
    catalogContents[item.externalId];
  const catalogServer =
    (cached?.server && typeof cached.server === "object"
      ? (cached.server as Record<string, unknown>)
      : undefined) ?? catalogMcpServers[item.externalId];

  if (catalogContent && typeof metadata.content !== "string") {
    metadata.content = catalogContent;
  }
  if (catalogServer && !hasResolvableMcpServer(metadata)) {
    metadata.server = catalogServer;
  }

  const enriched = Object.keys(metadata).length > 0 ? metadata : undefined;
  return {
    source: item.source,
    externalId: item.externalId,
    name: item.name,
    description: item.description ?? undefined,
    content:
      typeof enriched?.content === "string" ? enriched.content : undefined,
    metadata: enriched,
  };
}

export async function searchMarketplaceProfiles(options: {
  q?: string;
  take?: number;
  authorizedOwnerId?: string;
}): Promise<MarketplaceProfileSummary[]> {
  const query = options.q?.trim() ?? "";
  const take =
    options.take && options.take > 0 ? Math.min(options.take, 100) : 40;

  const profiles = await db.profile.findMany({
    where: {
      ...marketplaceVisibilityWhere(options.authorizedOwnerId),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { owner: { username: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, username: true } },
      _count: {
        select: {
          collections: true,
          skills: true,
          agents: true,
          mcps: true,
          docs: true,
        },
      },
    },
    orderBy: [{ isPublic: "desc" }, { updatedAt: "desc" }],
    take,
  });

  return profiles.map((profile) => ({
    id: profile.id,
    username: profile.owner.username,
    slug: profile.slug,
    name: profile.name,
    description: profile.description ?? undefined,
    isPublic: profile.isPublic,
    isOwned: profile.ownerId === options.authorizedOwnerId,
    counts: {
      collections: profile._count.collections,
      skills: profile._count.skills,
      agents: profile._count.agents,
      mcps: profile._count.mcps,
      docs: profile._count.docs,
    },
  }));
}

export async function searchMarketplaceCollections(options: {
  q?: string;
  type?: string | null;
  take?: number;
  authorizedOwnerId?: string;
}): Promise<MarketplaceCollectionSummary[]> {
  const query = options.q?.trim() ?? "";
  const take =
    options.take && options.take > 0 ? Math.min(options.take, 100) : 40;
  const type =
    options.type === "skill" ||
    options.type === "agent" ||
    options.type === "mcp"
      ? options.type
      : undefined;

  const collections = await db.collection.findMany({
    where: {
      ...marketplaceCollectionVisibilityWhere(options.authorizedOwnerId),
      ...(type ? { type } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { category: { slug: { contains: query, mode: "insensitive" } } },
              {
                subcategory: {
                  slug: { contains: query, mode: "insensitive" },
                },
              },
              {
                owner: { username: { contains: query, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { username: true } },
      category: true,
      subcategory: true,
      _count: { select: { items: true } },
    },
    orderBy: [{ isPublic: "desc" }, { updatedAt: "desc" }],
    take,
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description ?? undefined,
    type: collection.type,
    category: collection.category.slug,
    subcategory: collection.subcategory.slug,
    ownerUsername: collection.owner.username,
    isPublic: collection.isPublic,
    isOwned: collection.ownerId === options.authorizedOwnerId,
    itemCount: collection._count.items,
  }));
}

/**
 * Resolve a collection into a Profile Manifest v1 that apply-engine can install.
 * MCP items are placed in top-level `mcps` (apply-engine ignores MCP collection items).
 */
export async function resolveCollectionManifest(
  collectionId: string,
  authorizedOwnerId?: string,
) {
  const collection = await db.collection.findFirst({
    where: {
      id: collectionId,
      ...marketplaceCollectionVisibilityWhere(authorizedOwnerId),
    },
    include: {
      owner: true,
      category: true,
      subcategory: true,
      items: true,
    },
  });

  if (!collection) return null;
  if (
    !canAccessOwnedResource(
      collection.isPublic,
      collection.ownerId,
      authorizedOwnerId,
    )
  ) {
    return null;
  }

  const mappedItems = await Promise.all(collection.items.map(enrichItem));

  const mcps =
    collection.type === "mcp"
      ? mappedItems.flatMap((base) => {
          const server = resolveMcpServer(base.metadata);
          return server ? [{ ...base, server }] : [];
        })
      : [];

  const collectionPayload = {
    type: collection.type,
    category: collection.category.slug,
    subcategory: collection.subcategory.slug,
    name: collection.name,
    description: collection.description ?? undefined,
    items: mappedItems,
  };

  return {
    version: 1 as const,
    username: collection.owner.username,
    slug: `collection-${collection.id.slice(0, 12)}`,
    name: collection.name,
    description: collection.description ?? undefined,
    collections: [collectionPayload],
    skills: collection.type === "skill" ? mappedItems : [],
    agents: collection.type === "agent" ? mappedItems : [],
    mcps,
    docs: [],
    extensions: [],
  };
}
