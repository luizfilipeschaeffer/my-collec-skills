import {
  catalogContents,
  catalogMcpServers,
} from "@/lib/catalog-content";
import { lookupCatalogEntryMetadata } from "@/lib/catalog-sync";
import { db } from "@mcs/db";

export async function resolveProfileManifest(
  username: string,
  slug: string,
  authorizedOwnerId?: string,
) {
  const profile = await db.profile.findFirst({
    where: {
      slug,
      owner: { username },
      OR: [
        { isPublic: true },
        ...(authorizedOwnerId ? [{ ownerId: authorizedOwnerId }] : []),
      ],
    },
    include: {
      owner: true,
      collections: {
        include: {
          collection: {
            include: { category: true, subcategory: true, items: true },
          },
        },
      },
      skills: true,
      agents: true,
      mcps: true,
      docs: true,
      extensions: true,
    },
  });

  if (!profile) return null;

  const mapItem = async (item: {
    source: string;
    externalId: string;
    name: string;
    description: string | null;
    metadata: unknown;
  }) => {
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
  };

  const collectionItems = await Promise.all(
    profile.collections.map(async ({ collection }) => ({
      id: collection.id,
      type: collection.type,
      category: collection.category.slug,
      subcategory: collection.subcategory.slug,
      name: collection.name,
      description: collection.description ?? undefined,
      items: await Promise.all(collection.items.map(mapItem)),
    })),
  );

  const mcpSourceItems = [
    ...profile.mcps,
    ...profile.collections
      .filter(({ collection }) => collection.type === "mcp")
      .flatMap(({ collection }) => collection.items),
  ];

  const mcpMapped = await Promise.all(mcpSourceItems.map(mapItem));
  const mcpItems = mcpMapped.flatMap((base) => {
    const server = resolveMcpServer(base.metadata);
    return server ? [{ ...base, server }] : [];
  });

  const [skills, agents, docs] = await Promise.all([
    Promise.all(profile.skills.map(mapItem)),
    Promise.all(profile.agents.map(mapItem)),
    Promise.all(
      profile.docs.map(async (item) => ({
        ...(await mapItem(item)),
        url: item.url ?? undefined,
      })),
    ),
  ]);

  return {
    version: 1 as const,
    username: profile.owner.username,
    slug: profile.slug,
    name: profile.name,
    description: profile.description ?? undefined,
    collections: collectionItems,
    skills,
    agents,
    mcps: Array.from(
      new Map(mcpItems.map((item) => [item.externalId, item])).values(),
    ),
    docs,
    extensions: profile.extensions.map((item) => ({
      ide: item.ide,
      id: item.extensionId,
      name: item.name,
      description: item.description ?? undefined,
      metadata:
        item.metadata && typeof item.metadata === "object"
          ? item.metadata
          : undefined,
    })),
  };
}

function hasResolvableMcpServer(metadata: Record<string, unknown>) {
  return resolveMcpServer(metadata) !== null;
}

function resolveMcpServer(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
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
